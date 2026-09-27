import { useEffect, useState } from 'react';
import { EMPTY_REQUEST, type GenerateRequest } from '../../../shared/generation';
import { useProfile } from '../profile/useProfile';
import { readFields, writeFields } from '../storedFields';

type Job = Pick<GenerateRequest, 'jobTitle' | 'company'>;

const DRAFT_KEY = 'alt-shift.draft';

const EMPTY_JOB: Job = { jobTitle: EMPTY_REQUEST.jobTitle, company: EMPTY_REQUEST.company };

const FIELDS = ['jobTitle', 'company', 'skills', 'details'] as const;

function prefillPatch(prefill: unknown): Partial<GenerateRequest> {
  if (typeof prefill !== 'object' || prefill === null) return {};
  const patch: Partial<GenerateRequest> = {};
  for (const field of FIELDS) {
    const value = (prefill as Record<string, unknown>)[field];
    if (typeof value === 'string') patch[field] = value;
  }
  return patch;
}

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

export function useGeneratorFields({ prefill }: { prefill?: unknown } = {}) {
  const [arrived] = useState(() => arrival(prefill));
  const [job, setJob] = useState<Job>(arrived.job);
  const { profile, fill, setProfile, dropFill } = useProfile(arrived.fill);
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
    dropFill();
  }

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
