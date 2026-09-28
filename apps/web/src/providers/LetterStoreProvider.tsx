import { createContext, type ReactNode } from 'react';
import type { LetterStore } from '@services/letters/types';

type LetterStoreProviderProps = { store: LetterStore; children: ReactNode };

export const LetterStoreContext = createContext<LetterStore | null>(null);

export function LetterStoreProvider({ store, children }: LetterStoreProviderProps) {
  return <LetterStoreContext value={store}>{children}</LetterStoreContext>;
}
