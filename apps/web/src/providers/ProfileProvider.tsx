import { createContext, type ReactNode } from 'react';
import type { ProfileStore } from '@services/profile/types';

export const ProfileContext = createContext<ProfileStore | null>(null);

type ProfileProviderProps = { store: ProfileStore; children: ReactNode };

export function ProfileProvider({ store, children }: ProfileProviderProps) {
  return <ProfileContext value={store}>{children}</ProfileContext>;
}
