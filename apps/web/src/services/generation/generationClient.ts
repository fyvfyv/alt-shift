import { SseParserStream } from '@alt-shift/shared/sseParser';
import type { GenerateRequest } from '@alt-shift/shared/types';
import { VariantEventStream } from '@alt-shift/shared/variantDecoder';
import { looksWhole } from '@services/letters/model';
import { GenerationFailure } from './errors';
import { BodySource, IdleTimeoutStream } from './streams';
import type { EventReader, GenerationPort } from './types';

const DEFAULT_RETRY_AFTER_SECONDS = 30;
// Must outlast the model's longest pause between deltas.
const IDLE_TIMEOUT_MS = 30_000;
// Reading on to the upstream's close after [DONE] avoids ERR_ABORTED; cancel if it lingers.
const CLOSE_AFTER_DONE_MS = 2_000;

// A generator over a stream reader: the port must be async-iterable, and a ReadableStream is not
// before Safari 26.
export const generate: GenerationPort = async function* (req, signal) {
  const events = readEvents(await openStream(req, signal));
  let text = '';
  try {
    for (;;) {
      const { value: event } = await events.read();
      if (event?.type !== 'delta') break;
      text += event.text;
      yield event.text;
    }
    await drain(events);
    // drain() swallows errors, an abort's too; an aborted run must still end in its AbortError.
    signal.throwIfAborted();
  } catch (e) {
    throw isAbort(e, signal) ? e : failure(text);
  } finally {
    await release(events);
  }
  // The live API sometimes closes cleanly mid-letter, even after [DONE]: the text must look whole.
  if (!looksWhole(text)) throw failure(text);
};

async function openStream(
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> {
  const response = await post(req, signal);
  if (response.status === 429) {
    throw new GenerationFailure({ kind: 'rate-limit', retryAt: retryAt(response) });
  }
  const isEventStream = response.headers.get('Content-Type')?.startsWith('text/event-stream');
  if (!response.ok || !isEventStream || !response.body) {
    throw new GenerationFailure({ kind: 'upstream' });
  }
  return response.body;
}

async function post(req: GenerateRequest, signal: AbortSignal): Promise<Response> {
  try {
    return await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    throw isAbort(e, signal) ? e : new GenerationFailure({ kind: 'network' });
  }
}

// Delta-seconds only: an HTTP-date or a missing header parses to NaN and takes the default.
function retryAt(response: Response): number {
  const seconds = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
  return Date.now() + (seconds >= 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS) * 1000;
}

// The idle watchdog sits before the parser, on raw bytes: keepalive comments parse to nothing yet
// prove the upstream alive.
function readEvents(body: ReadableStream<Uint8Array<ArrayBuffer>>): EventReader {
  return new ReadableStream(new BodySource(body))
    .pipeThrough(new IdleTimeoutStream(IDLE_TIMEOUT_MS))
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new SseParserStream())
    .pipeThrough(new VariantEventStream())
    .getReader();
}

// Nothing after [DONE] can change the letter, so errors are ignored; one deadline for the drain.
async function drain(events: EventReader): Promise<void> {
  const deadline = setTimeout(() => release(events), CLOSE_AFTER_DONE_MS);
  try {
    while (!(await events.read()).done) {}
  } catch {
  } finally {
    clearTimeout(deadline);
  }
}

// Cancelling a stream that already failed rejects with that failure, which the read reported.
function release(events: EventReader): Promise<void> {
  return events.cancel().catch(() => {});
}

function isAbort(e: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (e instanceof DOMException && e.name === 'AbortError');
}

function failure(text: string): GenerationFailure {
  return new GenerationFailure({ kind: text ? 'stream-cut' : 'upstream' });
}
