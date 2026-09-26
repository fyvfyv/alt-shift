import { type ReactNode, useId } from 'react';
import { copy } from '../../copy';
import { GOAL } from '../../features/letters/model';
import typography from '../../styles/typography.module.css';
import { ProgressDots } from '../ProgressDots/ProgressDots';
import styles from './GoalBanner.module.css';

type GoalBannerProps = {
  count: number;
  // The page decides what "Create New" does: a link on the dashboard, a reset on the generator.
  action: ReactNode;
};

export function GoalBanner({ count, action }: GoalBannerProps) {
  const titleId = useId();
  if (count >= GOAL) return null;
  return (
    <section className={styles.banner} aria-labelledby={titleId}>
      <div className={styles.content}>
        <div className={styles.pitch}>
          <h2 id={titleId} className={`${styles.title} ${typography.displayMd}`}>
            {copy.goal.title}
          </h2>
          <p className={`${styles.subtitle} ${typography.lg}`}>{copy.goal.subtitle}</p>
          {action}
        </div>
        <div className={styles.progress}>
          <ProgressDots count={count} total={GOAL} variant="bars" />
          <p className={typography.lg}>{copy.goal.progress(count, GOAL)}</p>
        </div>
      </div>
    </section>
  );
}
