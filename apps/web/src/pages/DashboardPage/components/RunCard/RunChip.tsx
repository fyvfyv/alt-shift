import { useStalled } from '@hooks/useStalled';
import type { PreviewState } from '@services/generation/types';
import { CardChip } from '../Card/Card';
import { chipLabel, isWriting, streamedText } from './runView';

export function RunChip({ id, state }: { id: string; state: PreviewState }) {
  const stalled = useStalled(streamedText(state));
  return (
    <CardChip id={id} live={isWriting(state)}>
      {chipLabel(state, stalled)}
    </CardChip>
  );
}
