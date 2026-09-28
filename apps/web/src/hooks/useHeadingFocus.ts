import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function useHeadingFocus() {
  const { key } = useLocation();

  // Client-side navigation announces nothing, so focus the new h1. 'default' is the key of the
  // visit's first page, which keeps the browser's own focus.
  useEffect(() => {
    if (key === 'default') return;
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [key]);
}
