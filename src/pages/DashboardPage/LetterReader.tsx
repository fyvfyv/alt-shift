import { type MouseEvent, useEffect, useId, useRef } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { copy } from '../../copy';
import typography from '../../styles/typography.module.css';
import styles from './LetterReader.module.css';

type LetterReaderProps = {
  title: string;
  text: string;
  // Called once the dialog has closed: by Close, Escape or a click on the backdrop.
  onClose: () => void;
};

// The whole letter in a modal over the dashboard. A card that grew in place instead would move
// to a row of its own, or leave a hole beside its neighbor, and run lines too long to read.
export function LetterReader({ title, text, onClose }: LetterReaderProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Mounted means open. The check keeps a second run of the effect from calling it twice.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // A click on the backdrop lands on the dialog itself, outside its box. So does one on its own
  // scrollbar, but inside the box, and that one must not close it.
  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!inside) dialog.close();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is the keyboard's way out, built into the dialog
    <dialog
      ref={ref}
      className={styles.reader}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={closeOnBackdrop}
    >
      <div className={styles.sheet}>
        <h2 id={titleId} className={`${styles.title} ${typography.lgStrong}`}>
          {title}
        </h2>
        <LetterBody text={text} spacing="comfortable" />
        <div className={styles.footer}>
          <Button variant="tertiary" onClick={() => ref.current?.close()}>
            {copy.letter.close}
          </Button>
          <CopyButton text={text} />
        </div>
      </div>
    </dialog>
  );
}
