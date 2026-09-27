import { type Ref, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { LetterBody } from '../../components/LetterBody/LetterBody';
import { copy } from '../../copy';
import { type Letter, withSignature } from '../../features/letters/model';
import styles from './LetterCard.module.css';
import { LetterReader } from './LetterReader';

type LetterCardProps = {
  letter: Letter;
  // The profile name: signs a letter that ends on a bare closing, on screen and when copied.
  signature?: string;
  onDelete: () => void;
  deleteRef?: Ref<HTMLButtonElement>;
};

export function LetterCard({ letter, signature = '', onDelete, deleteRef }: LetterCardProps) {
  const text = withSignature(letter.text, signature);
  const title = copy.letter.title(letter.jobTitle, letter.company);
  const bodyRef = useRef<HTMLDivElement>(null);
  const readMoreRef = useRef<HTMLButtonElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [reading, setReading] = useState(false);

  // Whether the preview clips the letter changes with the card's width (a resize, a rotation),
  // the webfont swapping in and the signature line, so it is re-measured whenever the preview or
  // the text inside it changes size.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => setOverflows(body.scrollHeight > body.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    if (body.firstElementChild) observer.observe(body.firstElementChild);
    return () => observer.disconnect();
  }, []);

  function closeReader() {
    setReading(false);
    readMoreRef.current?.focus();
  }

  return (
    <article className={styles.card} aria-label={title}>
      <div ref={bodyRef} className={styles.body}>
        <LetterBody text={text} spacing="compact" />
      </div>
      {overflows && (
        <div className={styles.more}>
          <div className={styles.toggle}>
            <Button
              ref={readMoreRef}
              variant="tertiary"
              aria-haspopup="dialog"
              onClick={() => setReading(true)}
            >
              {copy.letter.readMore}
            </Button>
          </div>
        </div>
      )}
      <div className={styles.footer}>
        <Button ref={deleteRef} variant="tertiary" iconLeading="trash-01" onClick={onDelete}>
          {copy.letter.delete}
        </Button>
        <CopyButton text={text} />
      </div>
      {reading && <LetterReader title={title} text={text} onClose={closeReader} />}
    </article>
  );
}
