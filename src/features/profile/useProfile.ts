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

// `fill` (a handed-over example) is read on mount only. It shows in the fields the stored profile
// leaves empty but is never saved here: an example's bio is not the user's. A field stops showing
// it once edited, and dropFill takes it off every field still showing it. The returned `fill` is
// what is still on screen, for a caller to keep elsewhere.
export function useProfile(fill: ProfileFill = {}) {
  const [stored, setStored] = useState(readProfile);
  const [shownFill, setShownFill] = useState(fill);
  // Only an edit made here is written, so a page that just reads the profile never rewrites it.
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (changed) writeFields(() => localStorage, PROFILE_KEY, stored);
  }, [stored, changed]);

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
    setShownFill(({ skills, details }) => ({
      skills: patch.skills === undefined ? skills : undefined,
      details: patch.details === undefined ? details : undefined,
    }));
  }

  function dropFill() {
    setShownFill({});
  }

  const profile: Profile = {
    ...stored,
    skills: stored.skills || (shownFill.skills ?? ''),
    details: stored.details || (shownFill.details ?? ''),
  };
  const onScreen: ProfileFill = {
    skills: stored.skills ? undefined : shownFill.skills,
    details: stored.details ? undefined : shownFill.details,
  };
  return { profile, fill: onScreen, setProfile, dropFill };
}
