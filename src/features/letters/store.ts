import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Letter } from './model';
import { type LetterRepository, StorageError } from './repository';

export type LetterState = {
  letters: Letter[];
  lastStorageError: StorageError | null;
  hydrate(): Promise<void>;
  add(letter: Letter): Promise<void>;
  remove(id: string): Promise<void>;
};

export type LetterStore = StoreApi<LetterState>;

function newestFirst(letters: Letter[]): Letter[] {
  return letters.toSorted((a, b) => b.createdAt - a.createdAt);
}

export function createLetterStore({ repository }: { repository: LetterRepository }): LetterStore {
  return createStore<LetterState>()((set, get) => {
    async function relist() {
      set({ letters: newestFirst(await repository.list()) });
    }

    async function persist(write: () => Promise<void>) {
      try {
        await write();
      } catch (e) {
        if (!(e instanceof StorageError)) throw e;
        set({ lastStorageError: e });
      }
    }

    return {
      letters: [],
      lastStorageError: null,

      async hydrate() {
        await relist();
        // The store lives as long as the page, so the subscription is never torn down.
        repository.subscribe?.(() => void relist());
      },

      add(letter) {
        const existing = get().letters.find((l) => l.id === letter.id);
        const next = existing ? { ...letter, createdAt: existing.createdAt } : letter;
        const others = get().letters.filter((l) => l.id !== letter.id);
        set({ letters: newestFirst([next, ...others]) });
        return persist(() => repository.save(next));
      },

      remove(id) {
        set({ letters: get().letters.filter((l) => l.id !== id) });
        return persist(() => repository.remove(id));
      },
    };
  });
}
