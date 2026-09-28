import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { type InitialEntry, MemoryRouter } from 'react-router';
import { AppProviders } from '@providers/AppProviders';
import { GenerationQueue } from '@services/generation/queue';
import { InMemoryLetterRepository } from '@services/letters/inMemoryRepository';
import type { LetterRepository } from '@services/letters/repository';
import { loadLetterStore } from '@services/letters/store';
import type { Letter } from '@services/letters/types';
import { createProfileStore } from '@services/profile/profileStore';
import { FakeGenerationPort } from './fakeGenerationPort';

type Options = {
  url?: InitialEntry;
  letters?: Letter[];
  repository?: LetterRepository;
};

export async function renderWithProviders(
  ui: ReactNode,
  { url = '/', letters = [], repository = new InMemoryLetterRepository(letters) }: Options = {},
) {
  const store = await loadLetterStore(repository);
  const fake = new FakeGenerationPort();
  const queue = new GenerationQueue({ port: fake.port, letters: store });
  const profile = createProfileStore();
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[url]}>
      <AppProviders letters={store} queue={queue} profile={profile}>
        {ui}
      </AppProviders>
    </MemoryRouter>,
  );
  return { ...result, user, fake, store, queue, profile, repository };
}
