import { cx } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { copy, errorCopy } from '@copy';
import typography from '@styles/typography.module.css';
import { useGeneratorStore } from '../../hooks/useGeneratorSession';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import { useQueuedCaption } from '../../hooks/useQueuedCaption';
import { selectKeptTitle } from '../../session/derive';
import styles from './LetterPreview.module.css';
import { cutNote } from './previewStatus';
import type { KeptNoteKind } from './types';
import { useRateLimitWait } from './useRateLimitWait';

// Tertiary, not error red: the letter below it is fine and still saved. It sits above the letter,
// where it is seen, because after an edit the page title already names the new job.
export function KeptNote({ kind }: { kind: KeptNoteKind }) {
  const { preview } = useLetterOnScreen();
  const keptTitle = useGeneratorStore(selectKeptTitle);
  const queuedCaption = useQueuedCaption();
  const wait = useRateLimitWait();
  let note: ReactNode;
  if (kind === 'queued') note = copy.queue.queuedNote(queuedCaption);
  if (kind === 'cut') note = cutNote(true, keptTitle);
  if (kind === 'saved' && keptTitle) note = copy.preview.saved(keptTitle);
  if (kind === 'failed' && preview.status === 'error' && preview.error.kind !== 'stream-cut') {
    const { title, body } = errorCopy(preview.error);
    note = (
      <>
        <span role="alert">{`${title}. ${body} ${copy.preview.kept(keptTitle)}`}</span>
        {preview.error.kind === 'rate-limit' && (
          <>
            {' '}
            <span role="status">{wait}</span>
          </>
        )}
      </>
    );
  }
  return <p className={cx(styles.keptNote, typography.sm)}>{note}</p>;
}
