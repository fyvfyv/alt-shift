import type { Ref } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { LoadingOrb, useOrbExit } from '../../components/LoadingOrb/LoadingOrb';
import { copy } from '../../copy';
import type { GenerationError } from '../../features/generation/errors';
import type { PreviewState } from '../../features/generation/generationReducer';
import typography from '../../styles/typography.module.css';
import styles from './LetterPreview.module.css';

type LetterPreviewProps = {
  ref?: Ref<HTMLDivElement>;
  state: PreviewState;
  // Seconds left before a rate-limited request may be retried.
  retryCountdown: number;
  retryDisabled: boolean;
  onRetry: () => void;
  // The finished letter could not be written to storage.
  storageFailed: boolean;
};

type RetryableError = Exclude<GenerationError, { kind: 'stream-cut' }>;

function errorMessage(error: RetryableError, countdown: number) {
  switch (error.kind) {
    case 'rate-limit':
      return {
        title: copy.preview.rateLimit.title,
        body: countdown > 0 ? copy.preview.rateLimit.body(countdown) : copy.preview.rateLimit.ready,
      };
    case 'upstream':
      return copy.preview.upstream;
    case 'network':
      return copy.preview.network;
  }
}

function Content({
  state,
  retryCountdown,
  retryDisabled,
  onRetry,
  storageFailed,
}: LetterPreviewProps) {
  if (state.status === 'empty') {
    return <p className={`${styles.placeholder} ${typography.lg}`}>{copy.preview.empty}</p>;
  }
  if (state.status === 'error' && state.error.kind !== 'stream-cut') {
    const { title, body } = errorMessage(state.error, retryCountdown);
    return (
      <>
        {/* Retry stays outside the alert so the announcement is just the message. */}
        <div className={styles.error} role="alert">
          <p className={`${styles.errorTitle} ${typography.lgStrong}`}>{title}</p>
          <p className={`${styles.errorBody} ${typography.md}`}>{body}</p>
        </div>
        <Button variant="secondary" size="md" disabled={retryDisabled} onClick={onRetry}>
          {retryCountdown > 0 ? copy.preview.retryIn(retryCountdown) : copy.preview.retry}
        </Button>
      </>
    );
  }
  if (state.status === 'loading') return null;

  return (
    <>
      <div className={styles.content}>
        <LetterBody text={state.text ?? ''} paragraphGap={28} />
        {state.status === 'error' && (
          <p className={`${styles.cutNote} ${typography.sm}`}>{copy.preview.streamCut}</p>
        )}
      </div>
      {state.status === 'completed' && (
        <div className={styles.footer}>
          <CopyButton text={state.text} />
          {storageFailed && (
            <p className={`${styles.storageNote} ${typography.sm}`}>{copy.storageNote}</p>
          )}
        </div>
      )}
    </>
  );
}

export function LetterPreview({ ref, ...props }: LetterPreviewProps) {
  const { state } = props;
  const loading = state.status === 'loading';
  const orbExiting = useOrbExit(loading);
  const showOrb = loading || orbExiting;
  const centered = showOrb || (state.status === 'error' && state.error.kind !== 'stream-cut');

  // One live region for every state; aria-busy holds the announcement until the letter is done.
  return (
    <div
      ref={ref}
      className={styles.panel}
      data-layout={centered ? 'center' : undefined}
      aria-live="polite"
      aria-busy={loading || state.status === 'streaming'}
    >
      {showOrb ? <LoadingOrb exiting={orbExiting} /> : <Content {...props} />}
    </div>
  );
}
