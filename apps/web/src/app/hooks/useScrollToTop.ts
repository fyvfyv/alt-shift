import { useEffect, useEffectEvent } from 'react';
import { useLocation, useNavigationType } from 'react-router';

// New navigations start at the top; back/forward (POP) keeps the browser's scroll restoration.
export function useScrollToTop() {
  const { key } = useLocation();
  const navigationType = useNavigationType();
  const onNavigate = useEffectEvent((_key: string) => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  });

  useEffect(() => onNavigate(key), [key]);
}
