import type { ReactNode } from 'react';
import { copy } from '@copy';
import { useCanGenerate } from '../../hooks/useCanGenerate';

// aria-hidden: a ticking status would be re-announced each second; Retry's label has the seconds.
// "You can try again now." once the wait ends, unless the button is still blocked.
export function useRateLimitWait(): ReactNode {
  const { retryCountdown, canGenerate } = useCanGenerate();
  if (retryCountdown > 0) {
    return <span aria-hidden="true">{copy.preview.rateLimit.wait(retryCountdown)}</span>;
  }
  return canGenerate ? copy.preview.rateLimit.ready : null;
}
