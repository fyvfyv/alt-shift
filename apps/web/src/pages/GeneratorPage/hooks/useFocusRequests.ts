import { type RefObject, useLayoutEffect } from 'react';
import { focusField, focusSubmit } from '@utils/focus';
import { useGeneratorStore } from './useGeneratorSession';

// Moves the caret where the session asked, once the render that asked is on screen.
export function useFocusRequests(formRef: RefObject<HTMLFormElement | null>) {
  const focus = useGeneratorStore((state) => state.focus);
  useLayoutEffect(() => {
    if (focus?.target === 'submit') focusSubmit(formRef.current);
    else if (focus)
      focusField(formRef.current, focus.target, { preventScroll: focus.preventScroll });
  }, [focus, formRef]);
}
