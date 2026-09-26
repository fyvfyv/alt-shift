import { useCallback, useEffect, useState } from 'react';
import type { GenerateRequest } from '../../../shared/generation';

// Per tab: the form survives a reload, but two tabs never overwrite each other's drafts.
const KEY = 'alt-shift.draft';

const emptyDraft: GenerateRequest = { jobTitle: '', company: '', skills: '', details: '' };

function readDraft(): GenerateRequest {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return emptyDraft;
    const stored = parsed as Record<keyof GenerateRequest, unknown>;
    const field = (name: keyof GenerateRequest) => {
      const value = stored[name];
      return typeof value === 'string' ? value : '';
    };
    return {
      jobTitle: field('jobTitle'),
      company: field('company'),
      skills: field('skills'),
      details: field('details'),
    };
  } catch {
    return emptyDraft;
  }
}

// The draft is a convenience: when storage is unavailable the form simply isn't restored.
function writeDraft(draft: GenerateRequest): void {
  try {
    if (Object.values(draft).every((value) => value === '')) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {}
}

export function useDraft() {
  const [draft, setDraft] = useState(readDraft);

  useEffect(() => writeDraft(draft), [draft]);

  const update = useCallback((patch: Partial<GenerateRequest>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  // Forgets the stored copy only; the next edit saves again.
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { draft, update, clear };
}
