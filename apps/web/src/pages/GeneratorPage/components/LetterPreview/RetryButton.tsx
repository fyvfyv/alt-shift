import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import { useCanGenerate } from '../../hooks/useCanGenerate';
import { useGeneratorSession } from '../../hooks/useGeneratorSession';
import styles from './LetterPreview.module.css';

type RetryButtonProps = { label: 'retry' | 'tryAgain' };

const labels = { retry: copy.preview.retry, tryAgain: copy.generator.tryAgain };

// Follows the form's CTA: inert while the form is invalid, offline or counting down. aria-disabled,
// not disabled, so a blocked button keeps keyboard focus; its click is dropped.
export function RetryButton({ label }: RetryButtonProps) {
  const session = useGeneratorSession();
  const { canGenerate, retryCountdown } = useCanGenerate();
  const tryAgain = label === 'tryAgain';
  return (
    <Button
      variant="secondary"
      size="md"
      className={tryAgain ? styles.cutRetry : undefined}
      iconLeading={tryAgain ? 'repeat-03' : undefined}
      aria-disabled={!canGenerate || undefined}
      onClick={canGenerate ? session.retryFromPanel : undefined}
    >
      {retryCountdown > 0 ? copy.preview.retryIn(retryCountdown) : labels[label]}
    </Button>
  );
}
