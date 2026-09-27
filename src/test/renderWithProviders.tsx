import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { type InitialEntry, MemoryRouter } from 'react-router';
import { GenerationProvider } from '../features/generation/GenerationProvider';
import type { GenerationPort } from '../features/generation/generationClient';
import { InMemoryLetterRepository } from '../features/letters/inMemoryRepository';
import { LetterStoreProvider } from '../features/letters/LetterStoreProvider';
import type { Letter } from '../features/letters/model';
import type { LetterRepository } from '../features/letters/repository';
import { createLetterStore } from '../features/letters/store';
import { createFakePort } from './fakeGenerationPort';

type Options = {
  // A string, or an entry with history state (a prefilled job).
  url?: InitialEntry;
  letters?: Letter[];
  repository?: LetterRepository;
  port?: GenerationPort;
};

// Mirrors main.tsx: the store is hydrated before the first render.
export async function renderWithProviders(
  ui: ReactNode,
  {
    url = '/',
    letters = [],
    repository = new InMemoryLetterRepository(letters),
    port = createFakePort().port,
  }: Options = {},
) {
  const store = createLetterStore({ repository });
  await store.getState().hydrate();
  const result = render(
    <MemoryRouter initialEntries={[url]}>
      <LetterStoreProvider store={store}>
        <GenerationProvider port={port}>{ui}</GenerationProvider>
      </LetterStoreProvider>
    </MemoryRouter>,
  );
  return { ...result, store, repository };
}
