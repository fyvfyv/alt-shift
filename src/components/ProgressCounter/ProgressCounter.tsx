import { copy } from '../../copy';
import { displayCount, GOAL } from '../../features/letters/model';
import typography from '../../styles/typography.module.css';
import { CheckBadge } from '../CheckBadge/CheckBadge';
import { ProgressDots } from '../ProgressDots/ProgressDots';
import styles from './ProgressCounter.module.css';

export function ProgressCounter({ count }: { count: number }) {
  const shown = displayCount(count);
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
