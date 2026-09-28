import '@styles/index.css';
import type { GenerateRequest } from '@alt-shift/shared/types';
import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { PageShell } from '@app/components/PageShell/PageShell';
import { AppProviders } from '@providers/AppProviders';
import { GenerationQueue } from '@services/generation/queue';
import { InMemoryLetterRepository } from '@services/letters/inMemoryRepository';
import { loadLetterStore } from '@services/letters/store';
import type { Letter, LetterStore } from '@services/letters/types';
import { createProfileStore } from '@services/profile/profileStore';
import type { ProfileStore } from '@services/profile/types';
import { createStoryPort } from './storyData';

// Set per story as parameters, not args: args are spread onto the component as props.
type AppParameters = {
  letters?: Letter[];
  queued?: GenerateRequest[];
  generationDelayMs?: number;
  route?: string;
  chrome?: boolean;
};

const preview: Preview = {
  parameters: { layout: 'centered' },
  loaders: [
    async ({ parameters }) => {
      const { letters = [], queued = [], generationDelayMs = 40 } = parameters as AppParameters;
      const store = await loadLetterStore(new InMemoryLetterRepository(letters));
      const queue = new GenerationQueue({
        port: createStoryPort(generationDelayMs),
        letters: store,
      });
      for (const request of queued) queue.enqueue({ id: crypto.randomUUID(), request });
      return { store, queue, profile: createProfileStore() };
    },
  ],
  decorators: [
    (Story, { loaded, parameters }) => {
      const { route = '/', chrome = false } = parameters as AppParameters;
      return (
        <MemoryRouter initialEntries={[route]}>
          <AppProviders
            letters={loaded.store as LetterStore}
            queue={loaded.queue as GenerationQueue}
            profile={loaded.profile as ProfileStore}
          >
            {chrome ? (
              <PageShell>
                <Story />
              </PageShell>
            ) : (
              <Story />
            )}
          </AppProviders>
        </MemoryRouter>
      );
    },
  ],
};

export default preview;
