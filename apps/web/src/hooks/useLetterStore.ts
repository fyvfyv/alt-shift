import { useContext } from 'react';
import { useStore } from 'zustand';
import { LetterStoreContext } from '@providers/LetterStoreProvider';
import type { LetterState, LetterStore } from '@services/letters/types';

// The store itself, for code that reads it at a moment of its choosing instead of rendering from it.
export function useLetterStoreApi(): LetterStore {
  const store = useContext(LetterStoreContext);
  if (!store) throw new Error('useLetterStoreApi must be used inside <LetterStoreProvider>');
  return store;
}

export function useLetterStore<T>(selector: (state: LetterState) => T): T {
  return useStore(useLetterStoreApi(), selector);
}

export function useGeneratedCount(): number {
  return useLetterStore((state) => state.letters.length);
}

export function useStorageFailed(): boolean {
  return useLetterStore((state) => state.lastStorageError !== null);
}
