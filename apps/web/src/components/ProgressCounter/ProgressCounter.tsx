import { CheckBadge } from '@components/CheckBadge/CheckBadge';
import { ProgressDots } from '@components/ProgressDots/ProgressDots';
import { copy } from '@copy';
import { GOAL } from '@services/letters/model';
import typography from '@styles/typography.module.css';
import styles from './ProgressCounter.module.css';

export function ProgressCounter({ count }: { count: number }) {
  const shown = Math.min(count, GOAL);
  return (
    <div
      className={styles.counter}
      role="status"
      aria-label={copy.header.progressLabel(shown, GOAL)}
    >
      <span className={typography.lg}>
        {copy.header.progress(shown, GOAL)}
        <span className={styles.suffix}> {copy.header.progressSuffix}</span>
      </span>
      {count < GOAL ? <ProgressDots count={count} total={GOAL} /> : <CheckBadge />}
    </div>
  );
}
