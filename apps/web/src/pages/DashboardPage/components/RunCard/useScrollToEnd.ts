import { type RefObject, useLayoutEffect, useState } from 'react';

// Keeps the newest lines in view while the letter grows past the card; true once it has scrolled.
export function useScrollToEnd(boxRef: RefObject<HTMLElement | null>, text: string | undefined) {
  const [scrolled, setScrolled] = useState(false);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || text === undefined) return;
    box.scrollTop = box.scrollHeight;
    setScrolled(box.scrollTop > 0);
  }, [boxRef, text]);

  return text !== undefined && scrolled;
}
