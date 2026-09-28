import type { GenerateRequest } from '@alt-shift/shared/types';
import { DONE_EVENT, encodeDelta, KEEPALIVE_COMMENT } from '@alt-shift/shared/variantDecoder';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recorded } from '@test/fixtures';
import { GenerationFailure } from './errors';
import { generate } from './generationClient';
import type { GenerationError } from './types';

const request: GenerateRequest = {
  jobTitle: 'Frontend Engineer',
  company: 'Apple',
  skills: 'React',
  details: '',
};

const encoder = new TextEncoder();
// Ends on a sign-off, so looksWhole() lets it complete.
const LETTER = 'Dear Apple team,\n\nSincerely,';
const CUT = 'Dear Apple team,\n\nI build';

type StreamScript = {
  chunks: Uint8Array[];
  ending?: 'close' | 'open' | Error;
  onCancel?: () => void;
};

// Safari keeps the connection open when a pipe out of a fetch body cancels it; only a cancel from
// the body's own reader closes it. Pipes out of this body never cancel it.
class SafariBody<R> extends ReadableStream<R> {
  override pipeThrough<T>(
    transform: ReadableWritablePair<T, R>,
    options?: StreamPipeOptions,
  ): ReadableStream<T> {
    return super.pipeThrough(transform, { ...options, preventCancel: true });
  }

  override pipeTo(destination: WritableStream<R>, options?: StreamPipeOptions): Promise<void> {
    return super.pipeTo(destination, { ...options, preventCancel: true });
  }
}

// Abort errors the body with the signal's reason, as a real fetch does.
function stubStream({ chunks, ending = 'close', onCancel }: StreamScript) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const queue = [...chunks];
      const body = new SafariBody<Uint8Array>({
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

async function failure(promise: Promise<unknown>): Promise<GenerationError> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof GenerationFailure) return e.error;
    throw e;
  }
  expect.unreachable('expected a GenerationFailure');
}

describe('generate', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('posts the form fields as JSON to the proxy', async () => {
    stubStream({ chunks: [encoder.encode(encodeDelta(LETTER) + DONE_EVENT)] });

    await collect();

    expect(fetch).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    );
  });

  it.each([
    ['the Retry-After seconds', { 'Retry-After': '3' }, 3],
    ['30 seconds without Retry-After', undefined, 30],
  ])('maps 429 to rate-limit with %s', async (_, headers, seconds) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const body = { error: { code: 'rate_limit_exceeded', message: 'Slow down' } };
    stubResponse(Response.json(body, { status: 429, headers }));

    expect(await failure(collect())).toEqual({
      kind: 'rate-limit',
      retryAt: 1_000 + seconds * 1000,
    });
  });

  it.each([
    ['a 400 JSON error', Response.json({ error: { code: 'invalid_request' } }, { status: 400 })],
    [
      'a 200 HTML page',
      new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
    ],
  ])('maps %s to upstream', async (_, response) => {
    stubResponse(response);

    expect(await failure(collect())).toEqual({ kind: 'upstream' });
  });

  it('maps a fetch rejection to network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await failure(collect())).toEqual({ kind: 'network' });
  });

  it.each(['short', 'medium', 'long'] as const)(
    'yields every delta of the recorded %s letter and completes',
    async (name) => {
      const fixture = recorded(name);
      stubStream({ chunks: [encoder.encode(fixture.sse)] });

      const texts = await collect();

      expect(texts).toHaveLength(fixture.deltaCount);
      expect(texts.join('')).toBe(fixture.text);
    },
  );

  describe('after [DONE]', () => {
    it.each([
      ['closes', [], 'close' as const],
      ['errors', [], new TypeError('network error')],
      ['sends more before closing', [': bye\n\n'], 'close' as const],
    ])('completes without cancelling when the upstream %s', async (_, trailing, ending) => {
      const onCancel = vi.fn();
      const chunks = [encodeDelta(LETTER) + DONE_EVENT, ...trailing].map((c) => encoder.encode(c));
      stubStream({ chunks, ending, onCancel });

      expect(await collect()).toEqual([LETTER]);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('cancels an upstream still open after 2 s', async () => {
      vi.useFakeTimers();
      const onCancel = vi.fn();
      stubStream({
        chunks: [encoder.encode(encodeDelta(LETTER) + DONE_EVENT)],
        ending: 'open',
        onCancel,
      });

      const texts = collect();
      await vi.advanceTimersByTimeAsync(2_000);

      expect(await texts).toEqual([LETTER]);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('idle for 30 s', () => {
    it.each([
      ['after deltas', [encodeDelta('Dear')], 'stream-cut'],
      ['before any delta', [KEEPALIVE_COMMENT], 'upstream'],
    ])('cancels the stream and fails %s', async (_, chunks, kind) => {
      vi.useFakeTimers();
      const onCancel = vi.fn();
      stubStream({ chunks: chunks.map((c) => encoder.encode(c)), ending: 'open', onCancel });

      const outcome = failure(collect());
      await vi.advanceTimersByTimeAsync(30_000);

      expect(await outcome).toEqual({ kind });
      expect(onCancel).toHaveBeenCalled();
    });
  });

  it('completes on a clean close after deltas without [DONE]', async () => {
    const fixture = recorded('short');
    stubStream({ chunks: [encoder.encode(fixture.sse.replace(DONE_EVENT, ''))] });

    expect((await collect()).join('')).toBe(fixture.text);
  });

  it.each<[string, GenerationError['kind'], string[], StreamScript['ending']]>([
    ['[DONE] after a cut letter', 'stream-cut', [encodeDelta(CUT) + DONE_EVENT], 'close'],
    ['a clean close after a cut letter', 'stream-cut', [encodeDelta(CUT)], 'close'],
    [
      'a stream error after deltas',
      'stream-cut',
      [encodeDelta(CUT)],
      new TypeError('network error'),
    ],
    ['a clean close with nothing received', 'upstream', [KEEPALIVE_COMMENT], 'close'],
    ['a stream error before any delta', 'upstream', [], new TypeError('network error')],
  ])('maps %s to %s', async (_, kind, chunks, ending) => {
    stubStream({ chunks: chunks.map((c) => encoder.encode(c)), ending });

    expect(await failure(collect())).toEqual({ kind });
  });

  it('decodes UTF-8 sequences split across chunks', async () => {
    const fixture = recorded('medium');
    const multibyte = ' ’é — 🚀\n\n';
    const sse = encodeDelta(multibyte) + fixture.sse;
    const chunks = [...encoder.encode(sse)].map((byte) => Uint8Array.of(byte));
    stubStream({ chunks });

    expect((await collect()).join('')).toBe(multibyte + fixture.text);
  });

  it('rethrows the AbortError when aborted mid-stream', async () => {
    const controller = new AbortController();
    stubStream({ chunks: [encoder.encode(encodeDelta('Dear'))], ending: 'open' });

    const run = (async () => {
      for await (const _ of generate(request, controller.signal)) controller.abort();
    })();

    await expect(run).rejects.not.toBeInstanceOf(GenerationFailure);
    await expect(run).rejects.toMatchObject({ name: 'AbortError' });
  });

  it.each([
    ['a whole', LETTER],
    ['a cut', CUT],
  ])('rethrows the AbortError when aborted while draining after %s letter', async (_, letter) => {
    vi.useFakeTimers();
    const controller = new AbortController();
    stubStream({ chunks: [encoder.encode(encodeDelta(letter) + DONE_EVENT)], ending: 'open' });

    const run = collect(controller.signal);
    await vi.advanceTimersByTimeAsync(1_000);
    controller.abort();

    await expect(run).rejects.not.toBeInstanceOf(GenerationFailure);
    await expect(run).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rethrows the AbortError when aborted before the response', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await expect(collect()).rejects.toBe(abortError);
  });
});
