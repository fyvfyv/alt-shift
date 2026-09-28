import { copy } from '@copy';
import { useQueuePosition } from '@hooks/useQueuePosition';
import { useLetterOnScreen } from './useLetterOnScreen';

export function useQueuedCaption(): string {
  const { run } = useLetterOnScreen();
  return copy.queue.caption(useQueuePosition(run?.key));
}
