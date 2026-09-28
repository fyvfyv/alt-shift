import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';
import type { DashboardItem } from '../../types';
import { CardFocus } from './CardFocus';

export function useCardFocus(
  items: DashboardItem[],
  headingRef: RefObject<HTMLHeadingElement | null>,
): CardFocus {
  const [focus] = useState(() => new CardFocus());

  useEffect(() => {
    document.addEventListener('focusin', focus.track);
    return () => document.removeEventListener('focusin', focus.track);
  }, [focus]);

  useLayoutEffect(() => focus.settle(items, headingRef.current), [focus, items, headingRef]);

  return focus;
}
