import { useCountdown } from '@hooks/useCountdown';
import { useOnline } from '@hooks/useOnline';
import type { PreviewState } from '@services/generation/types';
import { retryAtOf } from './runView';

// Try Again waits out a rate limit's countdown, and for the connection to come back.
export function useRetryWait(state: PreviewState) {
  const online = useOnline();
  const countdown = useCountdown(retryAtOf(state));
  return { countdown, blocked: countdown > 0 || !online };
}
