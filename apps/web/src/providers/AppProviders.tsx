import type { ReactNode } from 'react';
import type { GenerationQueue } from '@services/generation/queue';
import type { LetterStore } from '@services/letters/types';
import type { ProfileStore } from '@services/profile/types';
import { GenerationProvider } from './GenerationProvider';
import { LetterStoreProvider } from './LetterStoreProvider';
import { ProfileProvider } from './ProfileProvider';

type AppProvidersProps = {
  letters: LetterStore;
  queue: GenerationQueue;
  profile: ProfileStore;
  children: ReactNode;
};

export function AppProviders({ letters, queue, profile, children }: AppProvidersProps) {
  return (
    <LetterStoreProvider store={letters}>
      <GenerationProvider queue={queue}>
        <ProfileProvider store={profile}>{children}</ProfileProvider>
      </GenerationProvider>
    </LetterStoreProvider>
  );
}
