import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import type { PreviewState } from '@services/generation/types';
import { useRetryWait } from './useRetryWait';

type RetryButtonProps = { state: PreviewState; onRetry: () => void };

// aria-disabled, not disabled, so a blocked button keeps keyboard focus; its click is dropped.
export function RetryButton({ state, onRetry }: RetryButtonProps) {
  const { countdown, blocked } = useRetryWait(state);
  return (
    <Button
      variant="secondary"
      size="md"
      iconLeading="repeat-03"
      aria-disabled={blocked || undefined}
      onClick={blocked ? undefined : onRetry}
    >
      {countdown > 0 ? copy.preview.retryIn(countdown) : copy.generator.tryAgain}
    </Button>
  );
}
