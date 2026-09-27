import { useEffect, useState } from 'react';
import type { GenerateRequest } from '../../../shared/generation';
import { readFields, writeFields } from '../storedFields';

type Profile = Pick<GenerateRequest, 'skills' | 'details'> & { name: string };
type ProfileFill = Partial<Pick<Profile, 'skills' | 'details'>>;

// Who the user is carries over between letters, so every tab shares it; `name` signs the letter.
const PROFILE_KEY = 'alt-shift.profile';

function readProfile(): Profile {
  return readFields(() => localStorage, PROFILE_KEY, ['skills', 'details', 'name']);
}

function fillEmpty(profile: Profile, fill: ProfileFill): Profile {
  return {
    ...profile,
    skills: profile.skills || (fill.skills ?? ''),
    details: profile.details || (fill.details ?? ''),
  };
}

// `fill` supplies the fields the stored profile leaves empty (a handed-over example). It is read
// on mount only and saved as if typed.
export function useProfile(fill: ProfileFill = {}) {
  const [profile, setStored] = useState(() => fillEmpty(readProfile(), fill));
  // Only a change made here is written, so a page that just reads the profile never rewrites it.
  const [changed, setChanged] = useState(() => Object.values(fill).some(Boolean));

  useEffect(() => {
    if (changed) writeFields(() => localStorage, PROFILE_KEY, profile);
  }, [profile, changed]);

  // Another tab edited the profile or cleared storage (`key === null`). The writing tab gets no
  // event, and writing back an identical value fires none either, so tabs cannot echo.
  useEffect(() => {
    const onStorage = ({ key }: StorageEvent) => {
      if (key === PROFILE_KEY || key === null) setStored(readProfile());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function setProfile(patch: Partial<Profile>) {
    setChanged(true);
    setStored((current) => ({ ...current, ...patch }));
  }

  return { profile, setProfile };
}
