import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { type InitialEntry, MemoryRouter } from 'react-router';
import { GenerationProvider } from '../features/generation/GenerationProvider';
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
};

// Mirrors main.tsx: the store is hydrated before the first render. Generation goes through a
// fake port the test drives.
export async function renderWithProviders(
  ui: ReactNode,
  { url = '/', letters = [], repository = new InMemoryLetterRepository(letters) }: Options = {},
) {
  const store = createLetterStore({ repository });
  await store.getState().hydrate();
  const fake = createFakePort();
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[url]}>
      <LetterStoreProvider store={store}>
        <GenerationProvider port={fake.port}>{ui}</GenerationProvider>
      </LetterStoreProvider>
    </MemoryRouter>,
  );
  return { ...result, user, fake, store, repository };
}
