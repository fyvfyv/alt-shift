import { type ReactNode, type Ref, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { LoadingOrb, useOrbExit } from '../../components/LoadingOrb/LoadingOrb';
import { ShimmerText } from '../../components/ShimmerText/ShimmerText';
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

const CAPTION_AFTER = 2;
const SLOW_AFTER = 8;
const STALLED_AFTER = 3;

type LetterPreviewProps = {
  ref?: Ref<HTMLElement>;
  state: PreviewState;
  retryCountdown: number;
  retryDisabled: boolean;
  onRetry: () => void;
  showCutRetry: boolean;
  savedLetter?: string;
  keptTitle?: string;
  storageFailed: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onNextCompany: () => void;
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

// aria-hidden: a ticking status would be re-announced each second; Retry's label has the seconds.
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
        <ShimmerText>
          {elapsed < SLOW_AFTER
            ? copy.preview.loading.writing(company)
            : copy.preview.loading.almost}
        </ShimmerText>
      </p>
    </div>
  );
}

type ContentProps = Omit<LetterPreviewProps, 'ref' | 'company' | 'savedLetter'> & {
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
  onNextCompany,
}: ContentProps) {
  const [copiedText, setCopiedText] = useState<string>();
  if (state.status === 'empty') {
    return <p className={`${styles.placeholder} ${typography.lg}`}>{copy.preview.empty}</p>;
  }
  if (state.status === 'loading') return null;

  // aria-disabled, not disabled, so a blocked button keeps keyboard focus; its click is dropped.
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
  } else if (complete && keptTitle) {
    keptNote = (
      <p className={`${styles.keptNote} ${typography.sm}`}>{copy.preview.saved(keptTitle)}</p>
    );
  }
  const offerNextCompany = complete && !keptNote && copiedText === text;
  return (
    <>
      <div className={styles.content}>
        {keptNote && (
          <div className={styles.kept}>
            {keptNote}
            {retry}
          </div>
        )}
        <LetterBody text={text} spacing="comfortable" />
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
            <CopyButton text={text} onCopied={() => setCopiedText(text)} />
          </div>
          <StorageNote failed={storageFailed} align="end" />
          {offerNextCompany && (
            <div className={styles.nextCompany}>
              <p className={`${styles.keptNote} ${typography.sm}`}>
                {copy.preview.nextCompany.prompt}
              </p>
              <Button variant="secondary" size="md" onClick={onNextCompany}>
                {copy.preview.nextCompany.action}
              </Button>
            </div>
          )}
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
  const streaming = state.status === 'streaming';
  const quiet = useElapsed(streaming, streaming ? state.text : undefined);
  const showOrb = loading || orbExiting;
  const writing = streaming && !showOrb;
  const kept = keptLetter(state, savedLetter);
  const failed = failedBeforeText(state, savedLetter);

  // Not a live region: the page's status line announces runs, so the letter isn't read mid-stream.
  return (
    <section
      ref={ref}
      className={styles.panel}
      data-layout={showOrb ? 'loading' : failed ? 'center' : undefined}
      data-writing={writing || undefined}
      aria-label={copy.preview.label}
    >
      {writing && (
        <p className={`${styles.writing} ${typography.smMedium}`}>
          <ShimmerText reveal={false}>
            {quiet >= STALLED_AFTER
              ? copy.preview.streaming.stalled
              : copy.preview.streaming.writing}
          </ShimmerText>
        </p>
      )}
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
