import type { GenerationError } from './types';
export class GenerationFailure extends Error {
  readonly error: GenerationError;

  constructor(error: GenerationError) {
    super(`Generation failed: ${error.kind}`);
    this.name = 'GenerationFailure';
    this.error = error;
  }
}
