import { cx } from 'class-variance-authority';
import { errorCopy } from '@copy';
import { failedBeforeText } from '@services/generation/selectors';
import typography from '@styles/typography.module.css';
import utilities from '@styles/utilities.module.css';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import styles from './LetterPreview.module.css';
import { RetryButton } from './RetryButton';
import { useRateLimitWait } from './useRateLimitWait';

// A failure with no letter to fall back on. Only fixed text goes in the alert, so it is announced
// once; the wait beside it is a status.
export function FailedView() {
  const { preview, savedLetter } = useLetterOnScreen();
  const wait = useRateLimitWait();
  const failed = failedBeforeText(preview, savedLetter);
  if (!failed) return null;
  const { title, body } = errorCopy(failed);
  return (
    <>
      <div className={styles.error} role="alert">
        <p className={cx(styles.errorTitle, typography.lgStrong)}>{title}</p>
        <p className={cx(styles.errorBody, typography.md)}>{body}</p>
      </div>
      {failed.kind === 'rate-limit' && (
        <p
          role="status"
          className={wait === null ? utilities.visuallyHidden : cx(styles.errorBody, typography.md)}
        >
          {wait}
        </p>
      )}
      <RetryButton label="retry" />
    </>
  );
}
