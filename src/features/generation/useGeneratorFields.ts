import { useCallback, useEffect, useMemo, useState } from 'react';
import { EMPTY_REQUEST, type GenerateRequest } from '../../../shared/generation';

type Job = Pick<GenerateRequest, 'jobTitle' | 'company'>;
export type Profile = Pick<GenerateRequest, 'skills' | 'details'> & { name: string };

// Per tab: the job survives a reload, but two tabs never overwrite each other's applications.
const JOB_KEY = 'alt-shift.draft';
// Who the user is carries over between letters, so every tab shares it; `name` signs the letter.
const PROFILE_KEY = 'alt-shift.profile';

const EMPTY_JOB: Job = { jobTitle: EMPTY_REQUEST.jobTitle, company: EMPTY_REQUEST.company };
const EMPTY_PROFILE: Profile = {
  skills: EMPTY_REQUEST.skills,
  details: EMPTY_REQUEST.details,
  name: '',
};

function parseStored(storage: () => Storage, key: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(storage().getItem(key) ?? 'null');
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function stringField(stored: Record<string, unknown>, name: string): string {
  const value = stored[name];
  return typeof value === 'string' ? value : '';
}

function readJob(): Job {
  const stored = parseStored(() => sessionStorage, JOB_KEY);
  if (!stored) return EMPTY_JOB;
  return { jobTitle: stringField(stored, 'jobTitle'), company: stringField(stored, 'company') };
}

function readProfile(): Profile {
  const stored = parseStored(() => localStorage, PROFILE_KEY);
  if (!stored) return EMPTY_PROFILE;
  return {
    skills: stringField(stored, 'skills'),
    details: stringField(stored, 'details'),
    name: stringField(stored, 'name'),
  };
}

// Storage is a convenience: when it is unavailable the fields simply aren't restored.
function write(storage: () => Storage, key: string, fields: Record<string, string>): void {
  try {
    if (Object.values(fields).every((value) => value === '')) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(fields));
  } catch {}
}

export function useProfile() {
  const [profile, setStored] = useState(readProfile);

  useEffect(() => write(() => localStorage, PROFILE_KEY, profile), [profile]);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setStored((current) => ({ ...current, ...patch }));
  }, []);

  return { profile, setProfile };
}

export function useGeneratorFields() {
  const [job, setJob] = useState(readJob);
  const { profile, setProfile } = useProfile();

  useEffect(() => write(() => sessionStorage, JOB_KEY, job), [job]);

  const values = useMemo<GenerateRequest>(
    () => ({
      jobTitle: job.jobTitle,
      company: job.company,
      skills: profile.skills,
      details: profile.details,
    }),
    [job, profile.skills, profile.details],
  );

  // Each field goes to its own storage, so a job edit never rewrites the profile and vice versa.
  const update = useCallback(
    ({ jobTitle, company, ...profilePatch }: Partial<GenerateRequest>) => {
      if (jobTitle !== undefined || company !== undefined) {
        setJob((current) => ({
          jobTitle: jobTitle ?? current.jobTitle,
          company: company ?? current.company,
        }));
      }
      if (profilePatch.skills !== undefined || profilePatch.details !== undefined) {
        setProfile(profilePatch);
      }
    },
    [setProfile],
  );

  const resetJob = useCallback(() => setJob(EMPTY_JOB), []);

  // Forgets the stored copy only; the next edit saves again.
  const forgetJob = useCallback(() => {
    try {
      sessionStorage.removeItem(JOB_KEY);
    } catch {}
  }, []);

  const setName = useCallback((name: string) => setProfile({ name }), [setProfile]);

  return { values, update, resetJob, forgetJob, profile: { name: profile.name }, setName };
}
