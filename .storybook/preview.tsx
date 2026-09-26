import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { GenerationProvider } from '../src/features/generation/GenerationProvider';
import { InMemoryLetterRepository } from '../src/features/letters/inMemoryRepository';
import { LetterStoreProvider } from '../src/features/letters/LetterStoreProvider';
import type { Letter } from '../src/features/letters/model';
import { createLetterStore, type LetterStore } from '../src/features/letters/store';
import { createStoryPort } from './storyData';
import '../src/styles/fonts.css';
import '../src/styles/tokens.css';
import '../src/styles/global.css';

// Set per story as parameters, not args: args are spread onto the component as props.
type AppParameters = {
  letters?: Letter[];
  generationDelayMs?: number;
  route?: string;
};

const preview: Preview = {
  parameters: { layout: 'centered' },
  // Mirrors main.tsx: the store is hydrated before the first render.
  loaders: [
    async ({ parameters }) => {
      const { letters = [] } = parameters as AppParameters;
      const store = createLetterStore({ repository: new InMemoryLetterRepository(letters) });
      await store.getState().hydrate();
      return { store };
    },
  ],
  decorators: [
    (Story, { loaded, parameters }) => {
      const { generationDelayMs = 40, route = '/' } = parameters as AppParameters;
      return (
        <MemoryRouter initialEntries={[route]}>
          <LetterStoreProvider store={loaded.store as LetterStore}>
            <GenerationProvider port={createStoryPort(generationDelayMs)}>
              <Story />
            </GenerationProvider>
          </LetterStoreProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default preview;
