import { createStore } from 'zustand/vanilla';
import { type LetterRepository, StorageError } from './repository';
import type { Letter, LetterState, LetterStore } from './types';

function newestFirst(letters: Letter[]): Letter[] {
  return letters.toSorted((a, b) => b.createdAt - a.createdAt);
}

export async function loadLetterStore(repository: LetterRepository): Promise<LetterStore> {
  const letters = newestFirst(await repository.list());

  const store = createStore<LetterState>()((set, get) => {
    async function persist(write: () => Promise<void>) {
      try {
        await write();
      } catch (e) {
        if (!(e instanceof StorageError)) throw e;
        set({ lastStorageError: e });
      }
    }

    return {
      letters,
      lastStorageError: null,

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

  // The store lives as long as the page, so the subscription is never torn down.
  repository.subscribe?.(async () => {
    store.setState({ letters: newestFirst(await repository.list()) });
  });
  return store;
}
