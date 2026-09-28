import { isPending } from '@services/generation/selectors';
import type { QueuePosition } from './types';
import { useCountdown } from './useCountdown';
import { useGenerationQueue } from './useGenerationQueue';
import { useOnline } from './useOnline';

export function useQueuePosition(key: string | undefined): QueuePosition {
  const online = useOnline();
  const runs = useGenerationQueue((s) => s.runs);
  const heldFor = useCountdown(useGenerationQueue((s) => s.heldUntil));
  const index = runs.findIndex((run) => run.key === key);
  const ahead = runs.slice(0, Math.max(index, 0)).findLast((run) => isPending(run.state));
  return { offline: !online, heldFor, aheadCompany: ahead?.request.company };
}
