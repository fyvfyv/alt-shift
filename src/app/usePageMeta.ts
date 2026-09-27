import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { copy } from '../copy';

export function usePageMeta(title: string) {
  const { key } = useLocation();

  useEffect(() => {
    document.title = copy.documentTitle(title);
  }, [title]);

  // Client-side navigation announces nothing, so focus the new h1. 'default' is the key of the
  // visit's first page, which keeps the browser's own focus.
  useEffect(() => {
    if (key === 'default') return;
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [key]);
}
