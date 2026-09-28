import { type RefObject, useLayoutEffect } from 'react';
import { scrollIntoViewIfBelow } from '@utils/focus';
import { useGeneratorStore } from './useGeneratorSession';

// A run started here brings the preview into view where it sits below the form.
export function useRevealOnRun(
  previewRef: RefObject<HTMLElement | null>,
  formRef: RefObject<HTMLFormElement | null>,
) {
  const reveals = useGeneratorStore((state) => state.reveals);
  useLayoutEffect(() => {
    if (reveals > 0) scrollIntoViewIfBelow(previewRef.current, formRef.current);
  }, [reveals, previewRef, formRef]);
}
