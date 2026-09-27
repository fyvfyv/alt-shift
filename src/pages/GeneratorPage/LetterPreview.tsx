import type { ReactNode, Ref } from 'react';
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
import utilities from '../../styles/utilities.module.css';
import styles from './LetterPreview.module.css';
import { SignatureField } from './SignatureField';

// Seconds into a run before the orb gets a caption, and before it admits the model is slow.
const CAPTION_AFTER = 2;
const SLOW_AFTER = 8;

type LetterPreviewProps = {
  ref?: Ref<HTMLElement>;
  state: PreviewState;
  retryCountdown: number;
  // Blocks every Retry and Try Again in the panel without taking them out of the tab order.
  retryDisabled: boolean;
  onRetry: () => void;
  // The Try Again under a cut or kept letter. Off once an edit makes the next run a new letter,
  // so the panel never offers a retry the form's CTA no longer does; the note under it stays.
  showCutRetry: boolean;
  storageFailed: boolean;
  // Signs the completed letter; the footer edits it in place.
  name: string;
  onNameChange: (name: string) => void;
  // Named in the loading caption.
  company: string;
};

type RetryableError = Exclude<GenerationError, { kind: 'stream-cut' }>;

function errorMessage(error: RetryableError): { title: string; body: string } {
  switch (error.kind) {
    case 'rate-limit':
      return copy.preview.rateLimit;
    case 'upstream':
      return copy.preview.upstream;
    case 'network':
      return copy.preview.network;
  }
}

// The seconds tick outside the accessibility tree (the Retry button's label carries them), so a
// screen reader hears only the end of the wait, once. Nothing is promised while Retry is blocked.
function waitText(countdown: number, blocked: boolean): ReactNode {
  if (countdown > 0) {
    return <span aria-hidden="true">{copy.preview.rateLimit.wait(countdown)}</span>;
  }
  return blocked ? null : copy.preview.rateLimit.ready;
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
  showCutRetry,
  storageFailed,
  name,
  onNameChange,
}: Omit<LetterPreviewProps, 'ref' | 'company'>) {
  if (state.status === 'empty') {
    return <p className={`${styles.placeholder} ${typography.lg}`}>{copy.preview.empty}</p>;
  }
  if (state.status === 'loading') return null;

  // aria-disabled, not disabled: a countdown or going offline must not drop keyboard focus, so a
  // blocked button keeps its tab stop and its click is dropped here.
  const retryProps = {
    variant: 'secondary',
    size: 'md',
    'aria-disabled': retryDisabled || undefined,
    onClick: retryDisabled ? undefined : onRetry,
  } as const;
  const failure =
    state.status === 'error' && state.error.kind !== 'stream-cut' ? state.error : null;
  // Only fixed text goes in an alert, so it is announced once; the wait beside it is a status.
  const wait = failure?.kind === 'rate-limit' ? waitText(retryCountdown, retryDisabled) : null;

  if (failure && state.text === undefined) {
    const { title, body } = errorMessage(failure);
    return (
      <>
        <div className={styles.error} role="alert">
          <p className={`${styles.errorTitle} ${typography.lgStrong}`}>{title}</p>
          <p className={`${styles.errorBody} ${typography.md}`}>{body}</p>
        </div>
        {failure.kind === 'rate-limit' && (
          <p
            role="status"
            className={
              wait === null ? utilities.visuallyHidden : `${styles.errorBody} ${typography.md}`
            }
          >
            {wait}
          </p>
        )}
        <Button {...retryProps}>
          {retryCountdown > 0 ? copy.preview.retryIn(retryCountdown) : copy.preview.retry}
        </Button>
      </>
    );
  }

  // A kept letter is the previous complete one, still saved, so it keeps its footer.
  const letter = state.text ?? '';
  const complete = state.status === 'completed' || failure !== null;
  const text = complete ? withSignature(letter, name) : letter;
  let note: ReactNode = null;
  if (failure) {
    const { title, body } = errorMessage(failure);
    note = (
      <p className={`${styles.keptNote} ${typography.sm}`}>
        <span role="alert">{`${title}. ${body} ${copy.preview.kept}`}</span>
        {failure.kind === 'rate-limit' && (
          <>
            {' '}
            <span role="status">{wait}</span>
          </>
        )}
      </p>
    );
  } else if (state.status === 'error') {
    note = <p className={`${styles.cutNote} ${typography.sm}`}>{copy.preview.streamCut}</p>;
  }
  return (
    <>
      <div className={styles.content}>
        <LetterBody text={text} spacing="comfortable" />
        {note}
        {note && showCutRetry && (
          <Button {...retryProps} className={styles.cutRetry} iconLeading="repeat-03">
            {retryCountdown > 0 ? copy.preview.retryIn(retryCountdown) : copy.generator.tryAgain}
          </Button>
        )}
      </div>
      {complete && (
        <div className={styles.footer}>
          <div className={styles.actions}>
            <SignatureField name={name} onChange={onNameChange} />
            <CopyButton text={text} />
          </div>
          <StorageNote failed={storageFailed} align="end" />
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
  const centered =
    state.status === 'error' && state.error.kind !== 'stream-cut' && state.text === undefined;

  // Not a live region: the page's status line says when a run starts, finishes or is cut, and an
  // error speaks through its own alert, so nothing in here is read twice or mid-stream.
  return (
    <section
      ref={ref}
      className={styles.panel}
      data-layout={showOrb ? 'loading' : centered ? 'center' : undefined}
      aria-label={copy.preview.label}
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
    </section>
  );
}
