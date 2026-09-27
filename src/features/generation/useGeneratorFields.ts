import { useEffect, useState } from 'react';
import { EMPTY_REQUEST, type GenerateRequest } from '../../../shared/generation';
import { useProfile } from '../profile/useProfile';
import { readFields, writeFields } from '../storedFields';

type Job = Pick<GenerateRequest, 'jobTitle' | 'company'>;

// Per tab: the job survives a reload, but two tabs never overwrite each other's applications. A
// handed-over bio still on screen is kept here too, never in the profile, so a reload right after
// Try an example shows the whole example again without making its bio the user's.
const DRAFT_KEY = 'alt-shift.draft';

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

// What arrives on mount: a hand-over replaces the draft; without one the draft comes back whole.
function arrival(prefill: unknown): { job: Job; fill: Partial<GenerateRequest> } {
  const draft = readFields(() => sessionStorage, DRAFT_KEY, FIELDS);
  const handedOver = prefillPatch(prefill);
  const fill = Object.keys(handedOver).length > 0 ? handedOver : draft;
  return {
    job: {
      jobTitle: handedOver.jobTitle ?? draft.jobTitle,
      company: handedOver.company ?? draft.company,
    },
    fill: { skills: fill.skills || undefined, details: fill.details || undefined },
  };
}

// `prefill` (a job handed over by a link) is read on mount only, so the first render already shows
// it. The job fields always take it (the link is the user's choice); the profile fields only when
// still empty, so a saved bio is never replaced by an example, and only on screen until edited.
export function useGeneratorFields({ prefill }: { prefill?: unknown } = {}) {
  const [arrived] = useState(() => arrival(prefill));
  const [job, setJob] = useState<Job>(arrived.job);
  const { profile, fill, setProfile, dropFill } = useProfile(arrived.fill);
  // Set once the letter is saved: the draft stays forgotten until the next edit of any field.
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) return;
    const draft: Record<string, string> = { ...job };
    if (fill.skills) draft.skills = fill.skills;
    if (fill.details) draft.details = fill.details;
    writeFields(() => sessionStorage, DRAFT_KEY, draft);
  }, [job, fill.skills, fill.details, saved]);

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

  // The next letter is for another job, so a handed-over bio the user never edited leaves with the
  // job it came with; a field they edited is theirs and stays.
  function resetJob() {
    setJob(EMPTY_JOB);
    dropFill();
  }

  // Forgets the stored copy only; the next edit of any field saves it again.
  function forgetJob() {
    setSaved(true);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  function setName(name: string) {
    setProfile({ name });
  }

  return { values, update, resetJob, forgetJob, profile: { name: profile.name }, setName };
}
