import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { copy } from '../copy';

export function usePageMeta(title: string) {
  const { key } = useLocation();

  useEffect(() => {
    document.title = copy.documentTitle(title);
  }, [title]);

  // After client-side navigation, move focus to the new page's h1 so screen readers announce it,
  // as a full page load would. The first page of a visit ('default' key) keeps the browser's focus.
  useEffect(() => {
    if (key === 'default') return;
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [key]);
}
