import { createContext, type ReactNode, useContext } from 'react';
import { useStore } from 'zustand';
import type { LetterState, LetterStore } from './store';

const LetterStoreContext = createContext<LetterStore | null>(null);

export function LetterStoreProvider({
  store,
  children,
}: {
  store: LetterStore;
  children: ReactNode;
}) {
  return <LetterStoreContext value={store}>{children}</LetterStoreContext>;
}

export function useLetterStore<T>(selector: (state: LetterState) => T): T {
  const store = useContext(LetterStoreContext);
  if (!store) throw new Error('useLetterStore must be used inside <LetterStoreProvider>');
  return useStore(store, selector);
}

// Derived, not stored: deleting letters below the goal re-opens it.
export function useGeneratedCount(): number {
  return useLetterStore((state) => state.letters.length);
}

export function useStorageFailed(): boolean {
  return useLetterStore((state) => state.lastStorageError !== null);
}
