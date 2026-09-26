import styles from './ProgressDots.module.css';

type ProgressDotsProps = {
  count: number;
  total: number;
  variant?: 'dots' | 'bars';
};

// Purely visual: the adjacent text carries the same number for assistive technology.
export function ProgressDots({ count, total, variant = 'dots' }: ProgressDotsProps) {
  return (
    <div className={styles.track} data-variant={variant} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, positional segments
        <span key={i} className={styles.segment} data-active={i < count || undefined} />
      ))}
    </div>
  );
}
