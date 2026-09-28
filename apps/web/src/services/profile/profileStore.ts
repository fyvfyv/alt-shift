import { createStore } from 'zustand/vanilla';
import { StoredFields } from '@services/storedFields';
import type { ProfileState, ProfileStore } from './types';

const storedProfile = new StoredFields({
  storage: () => localStorage,
  key: 'alt-shift.profile',
  names: ['skills', 'details', 'name'],
});

// What the user is good at, their details and the name that signs letters: kept in this browser,
// shared by its tabs, and written only when the user changes it.
export function createProfileStore(): ProfileStore {
  const store = createStore<ProfileState>()((set, get) => ({
    ...storedProfile.read(),
    update(patch) {
      set(patch);
      const { skills, details, name } = get();
      storedProfile.write({ skills, details, name });
    },
  }));

  // The writing tab gets no event, so tabs can't echo each other. The store lives with the page.
  window.addEventListener('storage', (event) => {
    if (storedProfile.changedBy(event)) store.setState(storedProfile.read());
  });

  return store;
}
