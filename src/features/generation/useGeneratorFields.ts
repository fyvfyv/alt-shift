import { useEffect, useState } from 'react';
import { EMPTY_REQUEST, type GenerateRequest } from '../../../shared/generation';
import { useProfile } from '../profile/useProfile';
import { readFields, writeFields } from '../storedFields';

type Job = Pick<GenerateRequest, 'jobTitle' | 'company'>;

// Per tab: the job survives a reload, but two tabs never overwrite each other's applications.
const JOB_KEY = 'alt-shift.draft';

const EMPTY_JOB: Job = { jobTitle: EMPTY_REQUEST.jobTitle, company: EMPTY_REQUEST.company };

const FIELDS = ['jobTitle', 'company', 'skills', 'details'] as const;

// A hand-over arrives as history state, so anything but a string field of the request is dropped.
function prefillPatch(prefill: unknown): Partial<GenerateRequest> {
  if (typeof prefill !== 'object' || prefill === null) return {};
  const patch: Partial<GenerateRequest> = {};
  for (const field of FIELDS) {
    const value = (prefill as Record<string, unknown>)[field];
    if (typeof value === 'string') patch[field] = value;
  }
  return patch;
}

function readJob(): Job {
  return readFields(() => sessionStorage, JOB_KEY, ['jobTitle', 'company']);
}

// `prefill` (a job handed over by a link) is read on mount only, so the first render already shows
// it. The job fields always take it (the link is the user's choice); the profile fields only when
// still empty, so a saved bio is never replaced by an example.
export function useGeneratorFields({ prefill }: { prefill?: unknown } = {}) {
  const prefilled = prefillPatch(prefill);
  const [job, setJob] = useState<Job>(() => {
    const stored = readJob();
    return {
      jobTitle: prefilled.jobTitle ?? stored.jobTitle,
      company: prefilled.company ?? stored.company,
    };
  });
  const { profile, setProfile } = useProfile({
    skills: prefilled.skills,
    details: prefilled.details,
  });
  // Set once the letter is saved: the draft stays forgotten until the next edit of any field.
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) writeFields(() => sessionStorage, JOB_KEY, job);
  }, [job, saved]);

  const values: GenerateRequest = {
    jobTitle: job.jobTitle,
    company: job.company,
    skills: profile.skills,
    details: profile.details,
  };

  // Each field goes to its own storage, so a job edit never rewrites the profile and vice versa.
  function update({ jobTitle, company, ...profilePatch }: Partial<GenerateRequest>) {
    setSaved(false);
    if (jobTitle !== undefined || company !== undefined) {
      setJob((current) => ({
        jobTitle: jobTitle ?? current.jobTitle,
        company: company ?? current.company,
      }));
    }
    if (profilePatch.skills !== undefined || profilePatch.details !== undefined) {
      setProfile(profilePatch);
    }
  }

  function resetJob() {
    setJob(EMPTY_JOB);
  }

  // Forgets the stored copy only; the next edit of any field saves it again.
  function forgetJob() {
    setSaved(true);
    try {
      sessionStorage.removeItem(JOB_KEY);
    } catch {}
  }

  function setName(name: string) {
    setProfile({ name });
  }

  return { values, update, resetJob, forgetJob, profile: { name: profile.name }, setName };
}
