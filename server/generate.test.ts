import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiErrorBody } from '../shared/generation';
import { handle } from './generate';
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

  it('passes the upstream SSE bytes through unchanged', async () => {
    const sse = ': keepalive\n\nevent: delta\ndata: {"text":"Dear"}\n\ndata: [DONE]\n\n';
    stubUpstream(new Response(sse, { headers: { 'Content-Type': 'text/event-stream' } }));

    const response = await handle(post(validBody), variantProvider, 'variant');

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(sse);
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

  it('aborts the upstream fetch when the client request is aborted', async () => {
    const fetchMock = stubUpstream(new Response(''));
    const controller = new AbortController();

    await handle(post(validBody, { signal: controller.signal }), variantProvider, 'variant');
    controller.abort();

    expect(fetchMock.mock.calls[0]?.[1].signal?.aborted).toBe(true);
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

  it('rejects non-POST methods with 405', async () => {
    const response = await handle(new Request('http://localhost/api/generate'), vi.fn(), 'variant');

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });
});
