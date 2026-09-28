import { cva } from 'class-variance-authority';
import styles from './ProgressDots.module.css';

type ProgressDotsProps = {
  count: number;
  total: number;
  variant?: 'dots' | 'bars';
};

const trackVariants = cva(styles.track, {
  variants: { variant: { dots: null, bars: styles.bars } },
});

export function ProgressDots({ count, total, variant = 'dots' }: ProgressDotsProps) {
  return (
    <div className={trackVariants({ variant })} aria-hidden>
      {Array.from({ length: total }, (_, i) => i).map((position) => (
        <span
          key={position}
          className={styles.segment}
          data-active={position < count || undefined}
        />
      ))}
    </div>
  );
}
