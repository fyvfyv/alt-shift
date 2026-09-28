import type { LetterRepository, StorageError } from './repository';
import type { Letter } from './types';

export class InMemoryLetterRepository implements LetterRepository {
  #letters: Letter[];
  #writeError: StorageError | null = null;

  constructor(seed: Letter[] = []) {
    this.#letters = [...seed];
  }

  rejectWritesWith(error: StorageError | null): void {
    this.#writeError = error;
  }

  async list(): Promise<Letter[]> {
    return [...this.#letters];
  }

  async save(letter: Letter): Promise<void> {
    if (this.#writeError) throw this.#writeError;
    const others = this.#letters.filter((l) => l.id !== letter.id);
    this.#letters = [...others, letter];
  }

  async remove(id: string): Promise<void> {
    if (this.#writeError) throw this.#writeError;
    this.#letters = this.#letters.filter((l) => l.id !== id);
  }
}
