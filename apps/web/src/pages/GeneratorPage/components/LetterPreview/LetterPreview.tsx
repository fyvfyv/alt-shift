import { cva } from 'class-variance-authority';
import { type RefObject, useRef } from 'react';
import { useOrbExit } from '@components/LoadingOrb/useOrbExit';
import { copy } from '@copy';
import utilities from '@styles/utilities.module.css';
import { useFollowLetter } from '../../hooks/useFollowLetter';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import { useRevealOnRun } from '../../hooks/useRevealOnRun';
import { EmptyView } from './EmptyView';
import { FailedView } from './FailedView';
import styles from './LetterPreview.module.css';
import { LetterView } from './LetterView';
import { LoadingView } from './LoadingView';
import { previewViewOf } from './previewStatus';
import { QueuedView } from './QueuedView';
import { WritingChip } from './WritingChip';

const panelVariants = cva([styles.panel, utilities.sheen], {
  variants: {
    view: {
      loading: styles.loading,
      failed: styles.center,
      queued: styles.center,
      empty: null,
      letter: null,
    },
  },
});

// The form it sits beside, or on a phone below.
type LetterPreviewProps = { formRef: RefObject<HTMLFormElement | null> };

// Not a live region: the page's status line announces runs, so the letter isn't read mid-stream.
export function LetterPreview({ formRef }: LetterPreviewProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { preview, savedLetter } = useLetterOnScreen();
  const orbExiting = useOrbExit(preview.status === 'loading');
  const showOrb = preview.status === 'loading' || orbExiting;
  const view = previewViewOf(preview, savedLetter, showOrb);
  const writing = preview.status === 'streaming' && !showOrb;
  useRevealOnRun(sectionRef, formRef);
  useFollowLetter(sectionRef, formRef);
  const views = {
    loading: <LoadingView exiting={orbExiting} />,
    queued: <QueuedView />,
    empty: <EmptyView />,
    failed: <FailedView />,
    letter: <LetterView />,
  };

  return (
    <section
      ref={sectionRef}
      className={panelVariants({ view })}
      data-writing={writing || undefined}
      aria-label={copy.preview.label}
    >
      {writing && <WritingChip />}
      {views[view]}
    </section>
  );
}
