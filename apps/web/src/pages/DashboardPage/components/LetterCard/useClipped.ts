import { type RefObject, useLayoutEffect, useState } from 'react';

// Whether the letter overflows its fixed-height box.
export function useClipped(boxRef: RefObject<HTMLElement | null>): boolean {
  const [clipped, setClipped] = useState(false);

  // Observe the text too: a font swap or a signature grows it inside the fixed-height box.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setClipped(box.scrollHeight > box.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, [boxRef]);

  return clipped;
}
