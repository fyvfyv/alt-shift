import { cx } from 'class-variance-authority';
import { useState } from 'react';
import { Button } from '@components/Button/Button';
import { LetterBody } from '@components/LetterBody/LetterBody';
import { copy } from '@copy';
import { useProfile } from '@hooks/useProfile';
import { keptLetter } from '@services/generation/selectors';
import { withSignature } from '@services/letters/model';
import typography from '@styles/typography.module.css';
import { useCta } from '../../hooks/useCta';
import { useGeneratorSession, useGeneratorStore } from '../../hooks/useGeneratorSession';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import { selectKeptTitle } from '../../session/derive';
import { KeptNote } from './KeptNote';
import { LetterFooter } from './LetterFooter';
import styles from './LetterPreview.module.css';
import { keptNoteKind, partialText } from './previewStatus';
import { RetryButton } from './RetryButton';

// The letter: streaming, whole, cut, or kept on screen while the next one is queued or failed.
export function LetterView() {
  const session = useGeneratorSession();
  const { preview, savedLetter } = useLetterOnScreen();
  const keptTitle = useGeneratorStore(selectKeptTitle);
  const name = useProfile((profile) => profile.name);
  const cta = useCta();
  const [copiedText, setCopiedText] = useState<string>();
  const kept = keptLetter(preview, savedLetter);
  const letter = kept ?? partialText(preview) ?? '';
  const text = kept === undefined ? letter : withSignature(letter, name);
  const note = keptNoteKind(preview, kept, keptTitle);
  const cut =
    kept === undefined && preview.status === 'error' && preview.error.kind === 'stream-cut';
  const retry = cta === 'tryAgain' && <RetryButton label="tryAgain" />;

  return (
    <>
      <div className={styles.content}>
        {note && (
          <div className={styles.kept}>
            <KeptNote kind={note} />
            {note === 'queued' ? (
              <Button variant="tertiary" className={styles.cutRetry} onClick={session.cancelQueued}>
                {copy.queue.cancel}
              </Button>
            ) : (
              retry
            )}
          </div>
        )}
        <LetterBody text={text} spacing="comfortable" />
        {cut && (
          <>
            <p className={cx(styles.cutNote, typography.sm)}>{copy.preview.streamCut}</p>
            {retry}
          </>
        )}
      </div>
      {kept !== undefined && (
        <LetterFooter
          letter={letter}
          text={text}
          offerNextCompany={!note && copiedText === text}
          onCopied={() => setCopiedText(text)}
        />
      )}
    </>
  );
}
