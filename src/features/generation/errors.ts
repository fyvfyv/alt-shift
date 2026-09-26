export type GenerationError =
  | { kind: 'rate-limit'; retryAfterSeconds: number }
  | { kind: 'upstream' }
  | { kind: 'network' }
  | { kind: 'stream-cut' };

export class GenerationFailure extends Error {
  readonly error: GenerationError;

  constructor(error: GenerationError) {
    super(`Generation failed: ${error.kind}`);
    this.name = 'GenerationFailure';
    this.error = error;
  }
}
