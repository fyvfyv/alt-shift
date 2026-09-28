import { cx } from 'class-variance-authority';
import { useId, useRef } from 'react';
import { Button } from '@components/Button/Button';
import { CopyButton } from '@components/CopyButton/CopyButton';
import { LetterBody } from '@components/LetterBody/LetterBody';
import { copy } from '@copy';
import typography from '@styles/typography.module.css';
import styles from './LetterReader.module.css';
import { useModalDialog } from './useModalDialog';

type LetterReaderProps = {
  title: string;
  text: string;
  onClose: () => void;
};

export function LetterReader({ title, text, onClose }: LetterReaderProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialog = useModalDialog(dialogRef);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is the keyboard's way out, built into the dialog
    <dialog
      ref={dialogRef}
      className={styles.reader}
      aria-labelledby={titleId}
      onClose={onClose}
      onPointerDown={dialog.trackPress}
      onClick={dialog.closeOnBackdrop}
    >
      <div className={styles.sheet}>
        <h2 id={titleId} className={cx(styles.title, typography.lgStrong)}>
          {title}
        </h2>
        <LetterBody text={text} spacing="comfortable" />
        <div className={styles.footer}>
          <Button variant="tertiary" onClick={dialog.close}>
            {copy.letter.close}
          </Button>
          <CopyButton text={text} />
        </div>
      </div>
    </dialog>
  );
}
