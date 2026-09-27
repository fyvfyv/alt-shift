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
  onClose: () => void;
};

export function LetterReader({ title, text, onClose }: LetterReaderProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // A backdrop click targets the dialog itself, outside its box. A click on its scrollbar
  // targets it too, but inside, and must not close it.
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
