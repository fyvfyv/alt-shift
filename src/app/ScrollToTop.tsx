import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

// New navigations start at the top; back/forward (POP) keeps the browser's scroll restoration.
export function ScrollToTop() {
  const { key } = useLocation();
  const navigationType = useNavigationType();

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the trigger, it changes on every navigation
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [key, navigationType]);

  return null;
}
