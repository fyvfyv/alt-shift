import type { GenerateRequest } from '@alt-shift/shared/types';
import { StoredFields } from '@services/storedFields';
import type { Arrival } from './types';

const FIELDS = ['jobTitle', 'company', 'skills', 'details'] as const;
// `runId`: the letter this job was handed to, so a return can tell it is written or on its way.
const DRAFT_FIELDS = [...FIELDS, 'runId'] as const;

const EMPTY_DRAFT = { jobTitle: '', company: '', skills: '', details: '', runId: '' };

// The job being typed in this tab, so a reload or a trip to the dashboard keeps it.
export const storedDraft = new StoredFields({
  storage: () => sessionStorage,
  key: 'alt-shift.draft',
  names: DRAFT_FIELDS,
});

function prefillPatch(prefill: unknown): Partial<GenerateRequest> {
  if (typeof prefill !== 'object' || prefill === null) return {};
  const patch: Partial<GenerateRequest> = {};
  for (const field of FIELDS) {
    const value = (prefill as Record<string, unknown>)[field];
    if (typeof value === 'string') patch[field] = value;
  }
  return patch;
}

// A handed-over job replaces the draft. Otherwise the draft comes back, unless its letter is
// `claimed`: saved or still being written.
export function arrivalOf(prefill: unknown, claimed: (runId: string) => boolean): Arrival {
  const stored = storedDraft.read();
  const draft = stored.runId && claimed(stored.runId) ? EMPTY_DRAFT : stored;
  const handedOver = prefillPatch(prefill);
  const handed = Object.keys(handedOver).length > 0;
  const fill = handed ? handedOver : draft;
  return {
    job: {
      jobTitle: handedOver.jobTitle ?? draft.jobTitle,
      company: handedOver.company ?? draft.company,
    },
    fill: { skills: fill.skills || undefined, details: fill.details || undefined },
    runId: handed ? undefined : draft.runId || undefined,
  };
}
