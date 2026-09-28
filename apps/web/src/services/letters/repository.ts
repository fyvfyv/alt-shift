import type { Letter } from './types';

export interface LetterRepository {
  list(): Promise<Letter[]>;
  // Upserts by id.
  save(letter: Letter): Promise<void>;
  remove(id: string): Promise<void>;
  // Fires only for changes made in another tab.
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
