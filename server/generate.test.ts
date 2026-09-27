import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from './generate';
import type { ApiErrorBody } from './jsonError';
import type { Provider } from './providers/types';
import { variantProvider } from './providers/variant';

const validBody = {
  jobTitle: 'Frontend Engineer',
  company: 'Northwind',
  skills: 'React',
  details: '',
};

function post(body: unknown, init: RequestInit = {}): Request {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
    headers: { Host: 'localhost', ...init.headers },
  });
}

async function errorCode(response: Response): Promise<string> {
  return ((await response.json()) as ApiErrorBody).error.code;
}

function stubUpstream(response: Response) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('handle', () => {
  beforeEach(() => {
    vi.stubEnv('GENERATION_API_TOKEN', 'test-token');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('forwards an upstream 429 verbatim and exposes only allowlisted headers', async () => {
    const errorBody = '{"error":{"code":"rate_limit_exceeded","message":"Slow down"}}';
    stubUpstream(
      new Response(errorBody, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '12',
          'X-Request-Id': 'req-1',
          'Set-Cookie': 'session=secret',
          'Access-Control-Allow-Origin': '*',
        },
      }),
    );

    const response = await handle(post(validBody), variantProvider, 'variant');

    expect(response.status).toBe(429);
    expect(await response.text()).toBe(errorBody);
    expect(Object.fromEntries(response.headers)).toEqual({
      'cache-control': 'no-cache, no-transform',
      'content-type': 'application/json',
      'retry-after': '12',
      'x-generation-provider': 'variant',
      'x-request-id': 'req-1',
    });
  });

  it('maps an unreachable upstream to 502 upstream_error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const response = await handle(post(validBody), variantProvider, 'variant');

    expect(response.status).toBe(502);
    expect(await errorCode(response)).toBe('upstream_error');
  });

  it('sends upstream only the token and content type, never the incoming headers', async () => {
    const fetchMock = stubUpstream(new Response(''));
    const request = post(validBody, {
      headers: { Cookie: 'session=secret', 'x-mock-scenario': 'disconnect' },
    });

    await handle(request, variantProvider, 'variant');

    const init = fetchMock.mock.calls[0]?.[1];
    expect(Object.fromEntries(new Headers(init?.headers))).toEqual({
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
    });
  });

  it('logs one JSON line per generation with input lengths and never the text', async () => {
    const provider = vi.fn<Provider>(async () => new Response(''));

    await handle(post({ ...validBody, details: 'secret bio' }), provider, 'mock');

    const line = String(vi.mocked(console.info).mock.lastCall?.[0]);
    expect(JSON.parse(line)).toMatchObject({
      event: 'generate',
      provider: 'mock',
      status: 200,
      detailsChars: 10,
      skillsChars: 5,
    });
    expect(line).not.toContain('secret bio');
    expect(line).not.toContain('Northwind');
  });

  it('logs a cancel line when the client aborts', async () => {
    const controller = new AbortController();

    await handle(
      post(validBody, { signal: controller.signal }),
      vi.fn<Provider>(async () => new Response('')),
      'mock',
    );
    controller.abort();

    const lines = vi.mocked(console.info).mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(lines).toContainEqual({ event: 'generate_cancelled', provider: 'mock' });
  });

  it('logs leaving before upstream answers as a 499 generate line, not a cancel', async () => {
    const controller = new AbortController();
    const provider = vi.fn<Provider>(async (_input, { signal }) => {
      controller.abort();
      throw signal.reason;
    });

    await expect(
      handle(post(validBody, { signal: controller.signal }), provider, 'mock'),
    ).rejects.toThrow();

    const lines = vi.mocked(console.info).mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(lines).toEqual([
      expect.objectContaining({
        event: 'generate',
        provider: 'mock',
        status: 499,
        requestId: null,
      }),
    ]);
  });

  it.each([
    ['a cross-site Sec-Fetch-Site', { 'Sec-Fetch-Site': 'cross-site', Origin: 'http://localhost' }],
    ['an Origin that does not match the Host', { Origin: 'http://evil.example' }],
    ['an opaque Origin', { Origin: 'null' }],
  ])('refuses a request with %s as 403 forbidden', async (_case, headers) => {
    const provider = vi.fn();

    const response = await handle(post(validBody, { headers }), provider, 'mock');

    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe('forbidden');
    expect(provider).not.toHaveBeenCalled();
  });

  it.each([
    ['invalid fields', { ...validBody, company: '  ' }],
    ['malformed JSON', '{"jobTitle":'],
  ])('rejects %s with a 400 invalid_request envelope', async (_case, body) => {
    const provider = vi.fn();

    const response = await handle(post(body), provider, 'variant');

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe('invalid_request');
    expect(provider).not.toHaveBeenCalled();
  });
});
