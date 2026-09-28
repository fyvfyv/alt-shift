import type { Ref } from 'react';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import styles from './ReadMore.module.css';

type ReadMoreProps = { ref: Ref<HTMLButtonElement>; onClick: () => void };

export function ReadMore({ ref, onClick }: ReadMoreProps) {
  return (
    <div className={styles.more}>
      <div className={styles.toggle}>
        <Button ref={ref} variant="tertiary" aria-haspopup="dialog" onClick={onClick}>
          {copy.letter.readMore}
        </Button>
      </div>
    </div>
  );
}
