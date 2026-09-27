import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiErrorBody } from '../../shared/generation';
import { variantProvider } from './variant';

const input = { system: '', prompt: '', maxTokens: 900 };
const request = { jobTitle: 'QA Lead', company: 'Acme', skills: 'Playwright', details: '' };

function context(signal = new AbortController().signal) {
  return { signal, request, headers: new Headers() };
}

// Never sends headers, but rejects on abort the way the real fetch does.
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
    vi.stubEnv('GENERATION_FIRST_BYTE_TIMEOUT_MS', '10');
    vi.stubGlobal('fetch', stallingFetch());
  });

  it('answers 504 upstream_error when the upstream never sends headers', async () => {
    const response = await variantProvider(input, context());

    expect(response.status).toBe(504);
    expect(((await response.json()) as ApiErrorBody).error).toEqual({
      code: 'upstream_error',
      message: 'The model took too long to start.',
    });
  });

  it('rethrows a client abort instead of answering 504', async () => {
    const controller = new AbortController();

    const pending = variantProvider(input, context(controller.signal));
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});
