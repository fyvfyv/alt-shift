import { type RefObject, useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '@utils/device';
import { sitsBelow } from '@utils/focus';
import { useLetterOnScreen } from './useLetterOnScreen';

// How far below the fold the letter's end may be and still count as read to the end: a smooth
// scroll trails the text by about a line.
const FOLLOW_SLACK = 96;

// Where the preview sits below the form, the page follows a streaming letter down to its newest
// line, and once it is written, to its Copy. Scrolled up to reread, it stays put.
export function useFollowLetter(
  previewRef: RefObject<HTMLElement | null>,
  formRef: RefObject<HTMLFormElement | null>,
) {
  const { preview } = useLetterOnScreen();
  const streamed = preview.status === 'streaming' ? preview.text : undefined;
  const written = preview.status === 'completed';
  const heightRef = useRef(0);
  const streamingRef = useRef(false);

  useLayoutEffect(() => {
    const justWritten = streamingRef.current && written;
    streamingRef.current = streamed !== undefined;
    const panel = previewRef.current;
    const form = formRef.current;
    if (!panel || !form) return;
    const { bottom, height } = panel.getBoundingClientRect();
    const grown = height - heightRef.current;
    heightRef.current = height;
    if ((streamed === undefined && !justWritten) || grown <= 0 || !sitsBelow(panel, form)) return;
    const fold = window.innerHeight;
    if (bottom <= fold || bottom - grown > fold + FOLLOW_SLACK) return;
    window.scrollTo({
      top: window.scrollY + bottom - fold,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
  }, [streamed, written, previewRef, formRef]);
}
