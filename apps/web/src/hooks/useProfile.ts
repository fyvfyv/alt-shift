import { useContext } from 'react';
import { useStore } from 'zustand';
import { ProfileContext } from '@providers/ProfileProvider';
import type { ProfileState, ProfileStore } from '@services/profile/types';

export function useProfileStoreApi(): ProfileStore {
  const store = useContext(ProfileContext);
  if (!store) throw new Error('useProfileStoreApi must be used inside <ProfileProvider>');
  return store;
}

export function useProfile<T>(selector: (state: ProfileState) => T): T {
  return useStore(useProfileStoreApi(), selector);
}
