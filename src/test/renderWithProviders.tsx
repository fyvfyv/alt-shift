import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { InMemoryLetterRepository } from '../features/letters/inMemoryRepository';
import { LetterStoreProvider } from '../features/letters/LetterStoreProvider';
import type { Letter } from '../features/letters/model';
import { createLetterStore } from '../features/letters/store';

type Options = { url?: string; letters?: Letter[] };

// Mirrors main.tsx: the store is hydrated before the first render.
export async function renderWithProviders(
  ui: ReactNode,
  { url = '/', letters = [] }: Options = {},
) {
  const repository = new InMemoryLetterRepository(letters);
  const store = createLetterStore({ repository });
  await store.getState().hydrate();
  const result = render(
    <MemoryRouter initialEntries={[url]}>
      <LetterStoreProvider store={store}>{ui}</LetterStoreProvider>
    </MemoryRouter>,
  );
  return { ...result, store, repository };
}
