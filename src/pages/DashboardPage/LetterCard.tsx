import type { Ref } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { copy } from '../../copy';
import type { Letter } from '../../features/letters/model';
import styles from './LetterCard.module.css';

type LetterCardProps = {
  letter: Letter;
  onDelete: () => void;
  deleteRef?: Ref<HTMLButtonElement>;
};

// The card shows the opening of the letter; Copy always takes the full text.
export function LetterCard({ letter, onDelete, deleteRef }: LetterCardProps) {
  return (
    <article
      className={styles.card}
      aria-label={copy.letter.title(letter.jobTitle, letter.company)}
    >
      <LetterBody text={letter.text} paragraphGap={18} className={styles.body} />
      <div className={styles.fade} />
      <div className={styles.footer}>
        <Button ref={deleteRef} variant="tertiary" iconLeading="trash-01" onClick={onDelete}>
          {copy.letter.delete}
        </Button>
        <CopyButton text={letter.text} />
      </div>
    </article>
  );
}
