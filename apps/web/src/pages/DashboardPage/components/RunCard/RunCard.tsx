import { useId } from 'react';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import { isPending } from '@services/generation/selectors';
import type { Run } from '@services/generation/types';
import { Card, CardFooter } from '../Card/Card';
import { useCardRefs } from '../LetterGrid/useCardRefs';
import { RetryButton } from './RetryButton';
import { RunBody } from './RunBody';
import { RunChip } from './RunChip';
import { hasChip, isWriting, runTitle } from './runView';

type RunCardProps = {
  run: Run;
  // Cancel while pending, Delete once failed: the same first button, so focus stays on it.
  onRemove: () => void;
  onRetry: () => void;
};

// A letter not saved yet: queued, being written, or failed.
export function RunCard({ run, onRemove, onRetry }: RunCardProps) {
  const { firstButton } = useCardRefs(run.id);
  const chipId = useId();
  const chip = hasChip(run.state);
  const pending = isPending(run.state);

  return (
    <Card
      label={runTitle(run)}
      chipId={chip ? chipId : undefined}
      writing={isWriting(run.state)}
      runId={run.id}
    >
      {chip && <RunChip id={chipId} state={run.state} />}
      <RunBody run={run} />
      <CardFooter>
        <Button
          ref={firstButton}
          variant="tertiary"
          iconLeading={pending ? undefined : 'trash-01'}
          onClick={onRemove}
        >
          {pending ? copy.queue.cancel : copy.letter.delete}
        </Button>
        {!pending && <RetryButton state={run.state} onRetry={onRetry} />}
      </CardFooter>
    </Card>
  );
}
