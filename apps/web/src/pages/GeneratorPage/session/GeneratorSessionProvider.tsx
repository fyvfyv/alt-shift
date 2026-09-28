import { createContext, type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useQueue } from '@hooks/useGenerationQueue';
import { useHeadingFocus } from '@hooks/useHeadingFocus';
import { useLetterStoreApi } from '@hooks/useLetterStore';
import { useProfileStoreApi } from '@hooks/useProfile';
import { useArrival } from '../hooks/useArrival';
import { GeneratorSession } from './GeneratorSession';

export const GeneratorSessionContext = createContext<GeneratorSession | null>(null);

// One session per visit to the page, so a return starts from the tab's draft.
export function GeneratorSessionProvider({ children }: { children: ReactNode }) {
  const queue = useQueue();
  const letters = useLetterStoreApi();
  const profile = useProfileStoreApi();
  const prefill: unknown = useLocation().state?.prefill;
  const [session] = useState(() => new GeneratorSession({ queue, letters, profile }, prefill));
  useEffect(() => session.connect(), [session]);
  useHeadingFocus();
  useArrival(session, prefill);
  return <GeneratorSessionContext value={session}>{children}</GeneratorSessionContext>;
}
