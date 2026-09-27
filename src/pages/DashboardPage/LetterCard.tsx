import { type Ref, useId, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { copy } from '../../copy';
import { type Letter, withSignature } from '../../features/letters/model';
import styles from './LetterCard.module.css';

type LetterCardProps = {
  letter: Letter;
  // The profile name: signs a letter that ends on a bare sign-off, on screen and when copied.
  signature?: string;
  onDelete: () => void;
  deleteRef?: Ref<HTMLButtonElement>;
};

export function LetterCard({ letter, signature = '', onDelete, deleteRef }: LetterCardProps) {
  const text = withSignature(letter.text, signature);
  const bodyId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Measured once, at rest: a letter that fits the preview has nothing more to read.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body) setOverflows(body.scrollHeight > body.clientHeight);
  }, []);

  return (
    <article
      className={styles.card}
      aria-label={copy.letter.title(letter.jobTitle, letter.company)}
      data-expanded={expanded || undefined}
    >
      <div ref={bodyRef} id={bodyId} className={styles.body}>
        <LetterBody text={text} spacing="compact" />
      </div>
      <div className={styles.footer}>
        <div className={styles.fade} />
        <Button ref={deleteRef} variant="tertiary" iconLeading="trash-01" onClick={onDelete}>
          {copy.letter.delete}
        </Button>
        {overflows && (
          <Button
            variant="tertiary"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? copy.letter.showLess : copy.letter.readMore}
          </Button>
        )}
        <CopyButton text={text} />
      </div>
    </article>
  );
}
