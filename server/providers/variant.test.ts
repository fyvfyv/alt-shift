import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiErrorBody } from '../jsonError';
import { variantProvider } from './variant';

const input = { system: '', prompt: '', maxTokens: 900 };
const FIRST_BYTE_TIMEOUT_MS = 10;
const request = { jobTitle: 'QA Lead', company: 'Acme', skills: 'Playwright', details: '' };

function context(signal = new AbortController().signal) {
  return { signal, request, headers: new Headers() };
}

function stallingFetch() {
  return vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      }),
  );
}

describe('variantProvider', () => {
  beforeEach(() => {
    vi.stubEnv('GENERATION_API_TOKEN', 'test-token');
    vi.stubEnv('GENERATION_FIRST_BYTE_TIMEOUT_MS', String(FIRST_BYTE_TIMEOUT_MS));
    vi.stubGlobal('fetch', stallingFetch());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers 504 upstream_error when the upstream never sends headers', async () => {
    const response = await variantProvider(input, context());

    expect(response.status).toBe(504);
    expect(((await response.json()) as ApiErrorBody).error.code).toBe('upstream_error');
  });

  it('clears the first-byte timer once headers arrive, so a slow body is never cut off', async () => {
    vi.useFakeTimers();
    let upstreamSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        upstreamSignal = init.signal ?? undefined;
        return new Response(new ReadableStream({ pull() {} }));
      }),
    );

    const response = await variantProvider(input, context());
    await vi.advanceTimersByTimeAsync(FIRST_BYTE_TIMEOUT_MS + 1);

    expect(response.status).toBe(200);
    expect(upstreamSignal?.aborted).toBe(false);
  });

  it('rethrows a client abort instead of answering 504', async () => {
    const controller = new AbortController();

    const pending = variantProvider(input, context(controller.signal));
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});
