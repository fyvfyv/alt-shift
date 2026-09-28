import { cx } from 'class-variance-authority';
import { LoadingOrb } from '@components/LoadingOrb/LoadingOrb';
import { ShimmerText } from '@components/ShimmerText/ShimmerText';
import { copy } from '@copy';
import { useElapsed } from '@hooks/useElapsed';
import typography from '@styles/typography.module.css';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import styles from './LetterPreview.module.css';

const CAPTION_AFTER = 2;
const SLOW_AFTER = 8;

// The orb, captioned once the wait is noticeable, and honest about it once it is long.
export function LoadingView({ exiting }: { exiting: boolean }) {
  const { preview, run } = useLetterOnScreen();
  // The loading state stays the same object until the first text arrives.
  const elapsed = useElapsed(preview.status === 'loading' ? preview : undefined);
  return (
    <>
      <div className={styles.orbSlot}>
        <LoadingOrb exiting={exiting} />
      </div>
      {elapsed >= CAPTION_AFTER && (
        <div className={styles.caption}>
          <p className={cx(styles.eyebrow, typography.smMedium)}>{copy.preview.loading.eyebrow}</p>
          <p className={cx(styles.placeholder, typography.lg)}>
            <ShimmerText>
              {elapsed < SLOW_AFTER
                ? copy.preview.loading.writing(run?.request.company ?? '')
                : copy.preview.loading.almost}
            </ShimmerText>
          </p>
        </div>
      )}
    </>
  );
}
