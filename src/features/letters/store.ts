import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Letter } from './model';
import { type LetterRepository, StorageError } from './repository';

export type LetterState = {
  // Newest first; the store owns the ordering.
  letters: Letter[];
  hydrated: boolean;
  lastStorageError: StorageError | null;
  hydrate(): Promise<void>;
  add(letter: Letter): Promise<void>;
  remove(id: string): Promise<void>;
};

export type LetterStore = StoreApi<LetterState>;

function newestFirst(letters: Letter[]): Letter[] {
  return letters.toSorted((a, b) => b.createdAt - a.createdAt);
}

// Memory is updated first and never rolled back: a failed write leaves the letter on screen
// for this session and surfaces `lastStorageError` so the UI can say it wasn't saved.
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
      hydrated: false,
      lastStorageError: null,

      async hydrate() {
        if (get().hydrated) return;
        await relist();
        // The store lives as long as the page, so the subscription is never torn down.
        repository.subscribe?.(() => void relist());
        set({ hydrated: true });
      },

      add(letter) {
        const others = get().letters.filter((l) => l.id !== letter.id);
        set({ letters: newestFirst([letter, ...others]) });
        return persist(() => repository.save(letter));
      },

      remove(id) {
        set({ letters: get().letters.filter((l) => l.id !== id) });
        return persist(() => repository.remove(id));
      },
    };
  });
}
