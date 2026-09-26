import { useCallback, useEffect, useRef, useState } from 'react';
import type { GenerateRequest } from '../../../shared/generation';

// Per tab: the form survives a reload, but two tabs never overwrite each other's drafts.
const KEY = 'alt-shift.draft';
const WRITE_DELAY_MS = 150;

export type Draft = GenerateRequest;

const emptyDraft: Draft = { jobTitle: '', company: '', skills: '', details: '' };

function readDraft(): Draft {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return emptyDraft;
    const stored = parsed as Record<keyof Draft, unknown>;
    const field = (name: keyof Draft) => {
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
function writeDraft(draft: Draft): void {
  try {
    if (Object.values(draft).every((value) => value === '')) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {}
}

export function useDraft() {
  const [draft, setDraft] = useState(readDraft);
  const pendingWrite = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    pendingWrite.current = setTimeout(() => writeDraft(draft), WRITE_DELAY_MS);
    return () => clearTimeout(pendingWrite.current);
  }, [draft]);

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  // Forgets the stored copy only; the next edit saves again.
  const clear = useCallback(() => {
    clearTimeout(pendingWrite.current);
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { draft, update, clear };
}
