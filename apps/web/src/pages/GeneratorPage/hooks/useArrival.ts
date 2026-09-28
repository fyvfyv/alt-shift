import { useEffect, useEffectEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isTouchOnly } from '@utils/device';
import type { GeneratorSession } from '../session/GeneratorSession';

// A handed-over job applies once, so a reload or Back never puts it over later edits. The caret
// starts in Job title when the job is empty, except where focusing opens a keyboard over the page.
export function useArrival(session: GeneratorSession, prefill: unknown) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onArrival = useEffectEvent(() => {
    if (prefill !== undefined) void navigate(pathname, { replace: true, state: null });
    const { job } = session.store.getState();
    if (job.jobTitle === '' && job.company === '' && !isTouchOnly()) {
      session.requestFocus({ target: 'jobTitle', preventScroll: true });
    }
  });

  // Call after useHeadingFocus: effects run in declaration order, so this focus wins over the h1's.
  useEffect(() => onArrival(), []);
}
