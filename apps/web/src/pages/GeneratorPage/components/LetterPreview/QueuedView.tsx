import { cx } from 'class-variance-authority';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import typography from '@styles/typography.module.css';
import { useGeneratorSession } from '../../hooks/useGeneratorSession';
import { useQueuedCaption } from '../../hooks/useQueuedCaption';
import styles from './LetterPreview.module.css';

export function QueuedView() {
  const session = useGeneratorSession();
  const queuedCaption = useQueuedCaption();
  return (
    <>
      <div className={styles.caption}>
        <p className={cx(styles.eyebrow, typography.smMedium)}>{copy.queue.label}</p>
        <p className={cx(styles.placeholder, typography.lg)}>{queuedCaption}</p>
      </div>
      <Button variant="tertiary" onClick={session.cancelQueued}>
        {copy.queue.cancel}
      </Button>
    </>
  );
}
