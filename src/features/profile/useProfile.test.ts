import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProfile } from './useProfile';

const PROFILE_KEY = 'alt-shift.profile';

describe('useProfile', () => {
  it('takes a name set in another tab', () => {
    const { result } = renderHook(() => useProfile());

    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: 'Oleg' }));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: PROFILE_KEY })));

    expect(result.current.profile.name).toBe('Oleg');
  });

  it('never writes the profile when it is only read', () => {
    const stored = JSON.stringify({ name: 'Oleg' });
    localStorage.setItem(PROFILE_KEY, stored);

    const { result } = renderHook(() => useProfile());

    expect(result.current.profile.name).toBe('Oleg');
    expect(localStorage.getItem(PROFILE_KEY)).toBe(stored);
  });
});
