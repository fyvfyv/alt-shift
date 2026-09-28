import type { ReactNode } from 'react';
import { StatusChip } from '@components/StatusChip/StatusChip';
import styles from './Card.module.css';
import { cardBodyVariants, cardVariants } from './cardVariants';
import type { CardBodyProps, CardChipProps, CardProps } from './types';

// The dashboard card's shell, shared by a saved letter and one still on its way.
export function Card({ label, chipId, writing, runId, children }: CardProps) {
  return (
    <article
      className={cardVariants({ chip: chipId !== undefined })}
      aria-label={label}
      aria-describedby={chipId}
      data-run={runId}
      data-writing={writing || undefined}
    >
      {children}
    </article>
  );
}

export function CardChip(props: CardChipProps) {
  return <StatusChip {...props} className={styles.chip} />;
}

export function CardBody({ ref, scrolled, cut, children }: CardBodyProps) {
  return (
    <div ref={ref} className={cardBodyVariants({ scrolled, cut })}>
      {children}
    </div>
  );
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}
