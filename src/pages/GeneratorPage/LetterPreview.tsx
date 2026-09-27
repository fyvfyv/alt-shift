import type { ReactNode, Ref } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { LoadingOrb, useOrbExit } from '../../components/LoadingOrb/LoadingOrb';
import { StorageNote } from '../../components/StorageNote/StorageNote';
import { copy } from '../../copy';
import {
  failedBeforeText,
  keptLetter,
  type PreviewState,
  type RetryableError,
} from '../../features/generation/generationReducer';
import { useElapsed } from '../../features/generation/useElapsed';
import { endsOnSignOff, withSignature } from '../../features/letters/model';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import styles from './LetterPreview.module.css';
import { cutNote } from './previewStatus';
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
  // The Try Again beside a cut or kept letter. Off once an edit makes the next run a new letter,
  // so the panel never offers a retry the form's CTA no longer does; the note beside it stays.
  showCutRetry: boolean;
  // The saved letter this run regenerates. A cut or a failure leaves it on screen, with its Copy,
  // under a note about the run.
  savedLetter?: string;
  // The job the kept letter was written for, when an edit has since changed the one in the form.
  keptTitle?: string;
  storageFailed: boolean;
  // Signs the completed letter; the footer edits it in place.
  name: string;
  onNameChange: (name: string) => void;
  // Named in the loading caption.
  company: string;
};

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

type ContentProps = Omit<LetterPreviewProps, 'ref' | 'company' | 'savedLetter'> & {
  // The complete letter on screen, if any: the one just finished, or the one a failed run kept.
  kept: string | undefined;
  failed: RetryableError | null;
};

function Content({
  state,
  kept,
  failed,
  retryCountdown,
  retryDisabled,
  onRetry,
  showCutRetry,
  keptTitle,
  storageFailed,
  name,
  onNameChange,
}: ContentProps) {
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
  // Only fixed text goes in an alert, so it is announced once; the wait beside it is a status.
  const wait = waitText(retryCountdown, retryDisabled);

  if (failed) {
    const { title, body } = errorMessage(failed);
    return (
      <>
        <div className={styles.error} role="alert">
          <p className={`${styles.errorTitle} ${typography.lgStrong}`}>{title}</p>
          <p className={`${styles.errorBody} ${typography.md}`}>{body}</p>
        </div>
        {failed.kind === 'rate-limit' && (
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

  const complete = kept !== undefined;
  const letter = kept ?? state.text ?? '';
  const text = complete ? withSignature(letter, name) : letter;
  // The name only ever goes under a sign-off, so without one there is nothing to offer.
  const signable = endsOnSignOff(letter);
  const failure =
    state.status === 'error' && state.error.kind !== 'stream-cut' ? state.error : null;
  const cut = state.status === 'error' && state.error.kind === 'stream-cut';
  const retry = showCutRetry && (
    <Button {...retryProps} className={styles.cutRetry} iconLeading="repeat-03">
      {retryCountdown > 0 ? copy.preview.retryIn(retryCountdown) : copy.generator.tryAgain}
    </Button>
  );
  let keptNote: ReactNode = null;
  if (complete && failure) {
    const { title, body } = errorMessage(failure);
    keptNote = (
      <p className={`${styles.keptNote} ${typography.sm}`}>
        <span role="alert">{`${title}. ${body} ${copy.preview.kept(keptTitle)}`}</span>
        {failure.kind === 'rate-limit' && (
          <>
            {' '}
            <span role="status">{wait}</span>
          </>
        )}
      </p>
    );
  } else if (complete && cut) {
    // The page's status line announces a cut, so this note stays out of the alerts.
    keptNote = <p className={`${styles.keptNote} ${typography.sm}`}>{cutNote(true, keptTitle)}</p>;
  }
  return (
    <>
      <div className={styles.content}>
        {/* Above a kept letter, where the eye lands: the form may name another job by now. */}
        {keptNote && (
          <div className={styles.kept}>
            {keptNote}
            {retry}
          </div>
        )}
        <LetterBody text={text} spacing="comfortable" />
        {/* Under a cut letter, where it marks the point the text stops. */}
        {cut && !complete && (
          <>
            <p className={`${styles.cutNote} ${typography.sm}`}>{copy.preview.streamCut}</p>
            {retry}
          </>
        )}
      </div>
      {complete && (
        <div className={styles.footer}>
          <div className={signable ? styles.actions : `${styles.actions} ${styles.copyOnly}`}>
            {signable && <SignatureField name={name} onChange={onNameChange} />}
            <CopyButton text={text} />
          </div>
          <StorageNote failed={storageFailed} align="end" />
        </div>
      )}
    </>
  );
}

export function LetterPreview({ ref, company, savedLetter, ...props }: LetterPreviewProps) {
  const { state } = props;
  const loading = state.status === 'loading';
  const orbExiting = useOrbExit(loading);
  const elapsed = useElapsed(loading);
  const showOrb = loading || orbExiting;
  const kept = keptLetter(state, savedLetter);
  const failed = failedBeforeText(state, savedLetter);

  // Not a live region: the page's status line says when a run starts, finishes or is cut, and an
  // error speaks through its own alert, so nothing in here is read twice or mid-stream.
  return (
    <section
      ref={ref}
      className={styles.panel}
      data-layout={showOrb ? 'loading' : failed ? 'center' : undefined}
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
        <Content {...props} kept={kept} failed={failed} />
      )}
    </section>
  );
}
