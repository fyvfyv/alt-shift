import { describe, expect, it } from 'vitest';
import { createProfileStore } from './profileStore';

const PROFILE_KEY = 'alt-shift.profile';

describe('createProfileStore', () => {
  it('takes a name set in another tab', () => {
    const profile = createProfileStore();

    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: 'Oleg' }));
    window.dispatchEvent(new StorageEvent('storage', { key: PROFILE_KEY }));

    expect(profile.getState().name).toBe('Oleg');
  });

  it('never writes the profile when it is only read', () => {
    const stored = JSON.stringify({ name: 'Oleg' });
    localStorage.setItem(PROFILE_KEY, stored);

    expect(createProfileStore().getState().name).toBe('Oleg');
    expect(localStorage.getItem(PROFILE_KEY)).toBe(stored);
  });

  it('keeps the whole profile when one field changes', () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ skills: 'Figma', details: 'Ten years' }));

    createProfileStore().getState().update({ name: 'Oleg' });

    expect(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')).toEqual({
      skills: 'Figma',
      details: 'Ten years',
      name: 'Oleg',
    });
  });
});
