import type { GenerateRequest } from '../../../shared/generation';
import { GenerationFailure } from './errors';
import { createSseParser } from './sseParser';
import { decode } from './variantDecoder';

// Yields the letter text as it streams. Throws only a GenerationFailure, or rethrows the
// AbortError when `signal` aborts the run.
export type GenerationPort = (req: GenerateRequest, signal: AbortSignal) => AsyncIterable<string>;

const DEFAULT_RETRY_AFTER_SECONDS = 30;

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

export const generate: GenerationPort = async function* (req, signal) {
  const reader = (await openStream(req, signal)).getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  let receivedText = false;

  for (;;) {
    let result: ReadableStreamReadResult<Uint8Array>;
    try {
      result = await reader.read();
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      throw new GenerationFailure({ kind: receivedText ? 'stream-cut' : 'upstream' });
    }
    if (result.done) break;

    for (const message of parser.feed(decoder.decode(result.value, { stream: true }))) {
      const event = decode(message);
      if (event?.type === 'done') {
        await reader.cancel();
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
