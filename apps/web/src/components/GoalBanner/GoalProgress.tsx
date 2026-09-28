import { ProgressDots } from '@components/ProgressDots/ProgressDots';
import { copy } from '@copy';
import { GOAL } from '@services/letters/model';
import typography from '@styles/typography.module.css';
import styles from './GoalBanner.module.css';

export function GoalProgress({ count }: { count: number }) {
  return (
    <div className={styles.progress}>
      <ProgressDots count={count} total={GOAL} variant="bars" />
      <p className={typography.lg}>{copy.goal.progress(count, GOAL)}</p>
    </div>
  );
}
