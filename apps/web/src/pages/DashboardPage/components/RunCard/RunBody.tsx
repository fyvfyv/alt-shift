import { useRef } from 'react';
import { LetterBody } from '@components/LetterBody/LetterBody';
import type { Run } from '@services/generation/types';
import { CardBody } from '../Card/Card';
import { CutBody } from './CutBody';
import { FailedBody } from './FailedBody';
import { QueuedBody } from './QueuedBody';
import { partialText, runViewOf, streamedText } from './runView';
import { StartingBody } from './StartingBody';
import { useScrollToEnd } from './useScrollToEnd';

export function RunBody({ run }: { run: Run }) {
  const view = runViewOf(run.state);
  const boxRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrollToEnd(boxRef, streamedText(run.state));
  const text = partialText(run.state);
  const views = {
    queued: <QueuedBody run={run} />,
    starting: <StartingBody run={run} />,
    streaming: <LetterBody text={text} spacing="compact" />,
    cut: <CutBody text={text} />,
    failed: <FailedBody run={run} />,
    none: null,
  };

  return (
    <CardBody ref={boxRef} scrolled={scrolled} cut={view === 'cut'}>
      {views[view]}
    </CardBody>
  );
}
