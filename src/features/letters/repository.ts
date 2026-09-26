import type { Letter } from './model';

export interface LetterRepository {
  list(): Promise<Letter[]>;
  // Upserts by id.
  save(letter: Letter): Promise<void>;
  remove(id: string): Promise<void>;
  // Fires when the letters change outside this repository (another tab). Returns an unsubscribe.
  subscribe?(onChange: () => void): () => void;
}

export class StorageError extends Error {
  readonly kind: 'quota' | 'unavailable';

  constructor(kind: 'quota' | 'unavailable', options?: ErrorOptions) {
    super(`Could not save letters: ${kind}`, options);
    this.name = 'StorageError';
    this.kind = kind;
  }
}
