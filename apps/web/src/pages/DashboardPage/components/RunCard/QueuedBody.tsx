import { copy } from '@copy';
import { useQueuePosition } from '@hooks/useQueuePosition';
import type { Run } from '@services/generation/types';
import { RunStatus } from './RunStatus';

export function QueuedBody({ run }: { run: Run }) {
  const position = useQueuePosition(run.key);
  return <RunStatus run={run}>{copy.queue.caption(position)}</RunStatus>;
}
