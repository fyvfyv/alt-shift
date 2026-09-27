import type { Ref } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { LoadingOrb, useOrbExit } from '../../components/LoadingOrb/LoadingOrb';
import { StorageNote } from '../../components/StorageNote/StorageNote';
import { copy } from '../../copy';
import type { GenerationError } from '../../features/generation/errors';
import type { PreviewState } from '../../features/generation/generationReducer';
import { useElapsed } from '../../features/generation/useElapsed';
import { withSignature } from '../../features/letters/model';
import typography from '../../styles/typography.module.css';
import styles from './LetterPreview.module.css';
import { SignatureField } from './SignatureField';

// Seconds into a run before the orb gets a caption, and before it admits the model is slow.
const CAPTION_AFTER = 2;
const SLOW_AFTER = 8;

type LetterPreviewProps = {
  ref?: Ref<HTMLDivElement>;
  state: PreviewState;
  retryCountdown: number;
  retryDisabled: boolean;
  onRetry: () => void;
  storageFailed: boolean;
  // Signs the completed letter; the footer edits it in place.
  name: string;
  onNameChange: (name: string) => void;
  // Named in the loading caption.
  company: string;
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

function LoadingCaption({ elapsed, company }: { elapsed: number; company: string }) {
  if (elapsed < CAPTION_AFTER) return null;
  return (
    <div className={styles.caption}>
      <p className={`${styles.eyebrow} ${typography.smMedium}`}>{copy.preview.loading.eyebrow}</p>
      <p className={`${styles.placeholder} ${typography.lg}`}>
        {elapsed < SLOW_AFTER ? copy.preview.loading.writing(company) : copy.preview.loading.almost}
      </p>
    </div>
  );
}

function Content({
  state,
  retryCountdown,
  retryDisabled,
  onRetry,
  storageFailed,
  name,
  onNameChange,
}: Omit<LetterPreviewProps, 'ref' | 'company'>) {
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

  const text = state.status === 'completed' ? withSignature(state.text, name) : (state.text ?? '');
  return (
    <>
      <div className={styles.content}>
        <LetterBody text={text} spacing="comfortable" />
        {state.status === 'error' && (
          <>
            <p className={`${styles.cutNote} ${typography.sm}`}>{copy.preview.streamCut}</p>
            <Button
              className={styles.cutRetry}
              variant="secondary"
              size="md"
              iconLeading="repeat-03"
              disabled={retryDisabled}
              onClick={onRetry}
            >
              {copy.generator.tryAgain}
            </Button>
          </>
        )}
      </div>
      {state.status === 'completed' && (
        <div className={styles.footer}>
          <div className={styles.actions}>
            <SignatureField name={name} onChange={onNameChange} />
            <CopyButton text={text} />
          </div>
          {storageFailed && <StorageNote align="end" />}
        </div>
      )}
    </>
  );
}

export function LetterPreview({ ref, company, ...props }: LetterPreviewProps) {
  const { state } = props;
  const loading = state.status === 'loading';
  const orbExiting = useOrbExit(loading);
  const elapsed = useElapsed(loading);
  const showOrb = loading || orbExiting;
  const centered = state.status === 'error' && state.error.kind !== 'stream-cut';

  // One live region for every state; aria-busy holds the announcement until the letter is done.
  return (
    <div
      ref={ref}
      className={styles.panel}
      data-layout={showOrb ? 'loading' : centered ? 'center' : undefined}
      aria-live="polite"
      aria-busy={loading || state.status === 'streaming'}
    >
      {showOrb ? (
        <>
          <div className={styles.orbSlot}>
            <LoadingOrb exiting={orbExiting} />
          </div>
          <LoadingCaption elapsed={elapsed} company={company} />
        </>
      ) : (
        <Content {...props} />
      )}
    </div>
  );
}
