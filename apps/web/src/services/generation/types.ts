import type { GenerateRequest } from '@alt-shift/shared/types';
import type { VariantEvent } from '@alt-shift/shared/variantDecoder';
import type { LetterStore } from '@services/letters/types';
import type { EventOf } from '@utils/reducer';

export type Run = {
  // The letter it writes: Try Again reuses it.
  readonly id: string;
  // This attempt: events of an attempt already cancelled or replaced find no run.
  readonly key: string;
  // The saved letter takes it, so a card keeps its place from queued to written.
  readonly createdAt: number;
  readonly request: GenerateRequest;
  readonly state: PreviewState;
};

export type NewRun = { id: string; request: GenerateRequest; previous?: string };

export type QueueState = {
  // In the order asked for; finished runs stay until replaced or their letter is deleted.
  runs: Run[];
  // Nothing starts before this Date.now(): the wait a 429 asked for.
  heldUntil: number;
  enqueue(run: NewRun): void;
  remove(id: string): void;
};

export type QueueDependencies = { port: GenerationPort; letters: LetterStore };

export type Attempt = { key: string; controller: AbortController };

// Throws only a GenerationFailure, or the AbortError when `signal` aborts.
export type GenerationPort = (req: GenerateRequest, signal: AbortSignal) => AsyncIterable<string>;

export type Reader = ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;

export type EventReader = ReadableStreamDefaultReader<VariantEvent>;

export type PreviewState =
  | { status: 'empty' }
  // `previous`: the letter on screen when this run was asked for, kept until it has text.
  | { status: 'queued'; previous?: string }
  | { status: 'loading'; previous?: string }
  | { status: 'streaming'; text: string }
  | { status: 'completed'; text: string }
  // `text`: the cut partial letter, or for other errors the previous letter still shown.
  | { status: 'error'; error: GenerationError; text?: string };

// What an attempt reports, by event type.
export type GenerationEvents = {
  start: Record<never, never>;
  delta: { text: string };
  done: Record<never, never>;
  error: { error: GenerationError };
};

export type GenerationEvent = EventOf<GenerationEvents>;

export type RetryableError = Exclude<GenerationError, { kind: 'stream-cut' }>;

export type GenerationError =
  // `retryAt`: when the wait ends, in Date.now() milliseconds.
  | { kind: 'rate-limit'; retryAt: number }
  | { kind: 'upstream' }
  | { kind: 'network' }
  | { kind: 'stream-cut' };
