import type { StoreApi } from 'zustand/vanilla';
import type { StorageError } from './repository';

export type Letter = {
  readonly id: string;
  readonly createdAt: number;
  readonly jobTitle: string;
  readonly company: string;
  readonly text: string;
};

export type NewLetter = {
  id?: string;
  createdAt?: number;
  jobTitle: string;
  company: string;
  text: string;
};

export type LetterState = {
  letters: Letter[];
  lastStorageError: StorageError | null;
  add(letter: Letter): Promise<void>;
  remove(id: string): Promise<void>;
};

export type LetterStore = StoreApi<LetterState>;
