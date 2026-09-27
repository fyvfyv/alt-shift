import type { GenerateRequest } from '../../../shared/generation';
import { createSseParser } from '../../../shared/sseParser';
import { decode } from '../../../shared/variantDecoder';
import { GenerationFailure } from './errors';

// Throws only a GenerationFailure, or the AbortError when `signal` aborts.
export type GenerationPort = (req: GenerateRequest, signal: AbortSignal) => AsyncIterable<string>;

const DEFAULT_RETRY_AFTER_SECONDS = 30;
// Longer than any pause the model takes between deltas; a stalled connection surfaces as an error
// instead of a spinner that never stops.
const IDLE_TIMEOUT_MS = 30_000;
// The upstream closes right after [DONE]; reading until then lets the browser record the request
// as completed instead of ERR_ABORTED. One that stays open is cancelled after this.
const CLOSE_AFTER_DONE_MS = 2_000;

const TIMED_OUT = Symbol('timed out');

type Reader = ReadableStreamDefaultReader<Uint8Array>;
type ReadResult = ReadableStreamReadResult<Uint8Array> | typeof TIMED_OUT;

function isAbort(e: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (e instanceof DOMException && e.name === 'AbortError');
}

async function openStream(
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  let response: Response;
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (isAbort(e, signal)) throw e;
    throw new GenerationFailure({ kind: 'network' });
  }

  if (response.status === 429) {
    // Only the delta-seconds form; an HTTP-date or a missing header falls back to the default.
    const seconds = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
    throw new GenerationFailure({
      kind: 'rate-limit',
      retryAfterSeconds: seconds >= 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS,
    });
  }
  // A 400 here means the form and the server disagree on validation: a bug, not user input.
  const isEventStream = response.headers.get('Content-Type')?.startsWith('text/event-stream');
  if (!response.ok || !isEventStream || !response.body) {
    throw new GenerationFailure({ kind: 'upstream' });
  }
  return response.body;
}

function readWithin(reader: Reader, ms: number): Promise<ReadResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  return Promise.race([reader.read(), timeout]).finally(() => clearTimeout(timer));
}

// The letter is complete once [DONE] arrived, so nothing the stream does afterwards can fail it.
async function drain(reader: Reader): Promise<void> {
  const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
    setTimeout(() => resolve(TIMED_OUT), CLOSE_AFTER_DONE_MS);
  });
  try {
    for (;;) {
      const result = await Promise.race([reader.read(), deadline]);
      if (result === TIMED_OUT) {
        await reader.cancel();
        return;
      }
      if (result.done) return;
    }
  } catch {}
}

export const generate: GenerationPort = async function* (req, signal) {
  const reader = (await openStream(req, signal)).getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  let receivedText = false;

  for (;;) {
    let result: ReadResult;
    try {
      result = await readWithin(reader, IDLE_TIMEOUT_MS);
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      throw new GenerationFailure({ kind: receivedText ? 'stream-cut' : 'upstream' });
    }
    if (result === TIMED_OUT) {
      await reader.cancel();
      throw new GenerationFailure({ kind: receivedText ? 'stream-cut' : 'upstream' });
    }
    if (result.done) break;

    for (const message of parser.feed(decoder.decode(result.value, { stream: true }))) {
      const event = decode(message);
      if (event?.type === 'done') {
        await drain(reader);
        return;
      }
      if (event?.type === 'delta') {
        receivedText = true;
        yield event.text;
      }
    }
  }

  // Without [DONE] a clean close still ends the letter, as long as some text arrived.
  if (!receivedText) throw new GenerationFailure({ kind: 'upstream' });
};
