import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GenerateRequest } from '../../../shared/generation';
import { recorded } from '../../test/fixtures';
import { GenerationFailure } from './errors';
import { generate } from './generationClient';

const request: GenerateRequest = {
  jobTitle: 'Frontend Engineer',
  company: 'Apple',
  skills: 'React',
  details: '',
};

const DONE = 'data: [DONE]\n\n';
const encoder = new TextEncoder();

function delta(text: string): string {
  return `event: delta\ndata: ${JSON.stringify({ text })}\n\n`;
}

// After the chunks the body closes, stays open, or errors with the given value.
type StreamScript = {
  chunks: Uint8Array[];
  ending?: 'close' | 'open' | Error;
  onCancel?: () => void;
};

// Abort errors the body with the signal's reason, as a real fetch does.
function stubStream({ chunks, ending = 'close', onCancel }: StreamScript) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const queue = [...chunks];
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          init.signal?.addEventListener('abort', () => controller.error(init.signal?.reason));
        },
        // One chunk per read: erroring from start() would discard chunks not yet read.
        pull(controller) {
          const chunk = queue.shift();
          if (chunk) controller.enqueue(chunk);
          else if (ending instanceof Error) controller.error(ending);
          else if (ending === 'close') controller.close();
        },
        cancel: onCancel,
      });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    }),
  );
}

function stubResponse(response: Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response),
  );
}

async function collect(signal = new AbortController().signal): Promise<string[]> {
  const texts: string[] = [];
  for await (const text of generate(request, signal)) texts.push(text);
  return texts;
}

async function failure(promise: Promise<unknown>): Promise<GenerationFailure['error']> {
  const error = await promise.then(
    () => expect.unreachable('expected a GenerationFailure'),
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(GenerationFailure);
  return (error as GenerationFailure).error;
}

describe('generate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the form fields as JSON to the proxy', async () => {
    stubStream({ chunks: [encoder.encode(delta('Dear') + DONE)] });

    await collect();

    expect(fetch).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    );
  });

  it.each([
    ['the Retry-After seconds', { 'Retry-After': '3' }, 3],
    ['30 seconds without Retry-After', undefined, 30],
  ])('maps 429 to rate-limit with %s', async (_, headers, retryAfterSeconds) => {
    const body = { error: { code: 'rate_limit_exceeded', message: 'Slow down' } };
    stubResponse(Response.json(body, { status: 429, headers }));

    expect(await failure(collect())).toEqual({ kind: 'rate-limit', retryAfterSeconds });
  });

  it.each([
    ['a 400 JSON error', Response.json({ error: { code: 'invalid_request' } }, { status: 400 })],
    ['a 502 JSON error', Response.json({ error: { code: 'upstream_error' } }, { status: 502 })],
    [
      'a 200 HTML page',
      new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
    ],
    [
      'a 200 SSE without a body',
      new Response(null, { headers: { 'Content-Type': 'text/event-stream' } }),
    ],
  ])('maps %s to upstream', async (_, response) => {
    stubResponse(response);

    expect(await failure(collect())).toEqual({ kind: 'upstream' });
  });

  it('maps a fetch rejection to network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await failure(collect())).toEqual({ kind: 'network' });
  });

  it('yields every recorded delta and cancels the reader on [DONE]', async () => {
    const fixture = recorded('short');
    const onCancel = vi.fn();
    stubStream({ chunks: [encoder.encode(fixture.sse)], ending: 'open', onCancel });

    const texts = await collect();

    expect(texts).toHaveLength(fixture.deltaCount);
    expect(texts.join('')).toBe(fixture.text);
    expect(onCancel).toHaveBeenCalled();
  });

  it('completes on a clean close after deltas without [DONE]', async () => {
    const fixture = recorded('short');
    stubStream({ chunks: [encoder.encode(fixture.sse.replace(DONE, ''))] });

    expect((await collect()).join('')).toBe(fixture.text);
  });

  it('decodes UTF-8 sequences split across chunks', async () => {
    const fixture = recorded('medium');
    // One byte per chunk splits every multibyte character (the transcript contains ’).
    const chunks = [...encoder.encode(fixture.sse)].map((byte) => Uint8Array.of(byte));
    stubStream({ chunks });

    expect((await collect()).join('')).toBe(fixture.text);
  });

  it('maps a clean close with nothing received to upstream', async () => {
    stubStream({ chunks: [encoder.encode(': keepalive\n\n')] });

    expect(await failure(collect())).toEqual({ kind: 'upstream' });
  });

  it('maps a stream error after deltas to stream-cut', async () => {
    stubStream({ chunks: [encoder.encode(delta('Dear'))], ending: new TypeError('network error') });

    expect(await failure(collect())).toEqual({ kind: 'stream-cut' });
  });

  it('maps a stream error before any delta to upstream', async () => {
    stubStream({ chunks: [], ending: new TypeError('network error') });

    expect(await failure(collect())).toEqual({ kind: 'upstream' });
  });

  it('rethrows the AbortError when aborted mid-stream', async () => {
    const controller = new AbortController();
    stubStream({ chunks: [encoder.encode(delta('Dear'))], ending: 'open' });

    const run = (async () => {
      for await (const _ of generate(request, controller.signal)) controller.abort();
    })();

    const error = await run.then(
      () => expect.unreachable('expected an AbortError'),
      (e) => e,
    );
    expect(error).not.toBeInstanceOf(GenerationFailure);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('rethrows the AbortError when aborted before the response', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await expect(collect()).rejects.toBe(abortError);
  });
});
