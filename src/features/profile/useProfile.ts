import { useEffect, useState } from 'react';
import type { GenerateRequest } from '../../../shared/generation';
import { readFields, writeFields } from '../storedFields';

type Profile = Pick<GenerateRequest, 'skills' | 'details'> & { name: string };
type ProfileFill = Partial<Pick<Profile, 'skills' | 'details'>>;

const PROFILE_KEY = 'alt-shift.profile';

function readProfile(): Profile {
  return readFields(() => localStorage, PROFILE_KEY, ['skills', 'details', 'name']);
}

// `fill` shows in empty fields but is never stored; the returned `fill` is what is still shown.
export function useProfile(fill: ProfileFill = {}) {
  const [stored, setStored] = useState(readProfile);
  const [shownFill, setShownFill] = useState(fill);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (changed) writeFields(() => localStorage, PROFILE_KEY, stored);
  }, [stored, changed]);

  // key null = storage cleared. The writing tab and unchanged values get no event: tabs can't echo.
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
