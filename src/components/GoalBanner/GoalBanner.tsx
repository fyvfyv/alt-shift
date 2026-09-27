import { type ReactNode, useId } from 'react';
import { copy } from '../../copy';
import { GOAL } from '../../features/letters/model';
import typography from '../../styles/typography.module.css';
import { ProgressDots } from '../ProgressDots/ProgressDots';
import styles from './GoalBanner.module.css';

type GoalBannerProps = {
  count: number;
  action: ReactNode;
  reachedAction?: ReactNode;
};

export function GoalBanner({ count, action, reachedAction }: GoalBannerProps) {
  const titleId = useId();
  const reached = count >= GOAL;
  if (reached && !reachedAction) return null;
  const shown = reached ? GOAL : count;
  return (
    <section className={styles.banner} aria-labelledby={titleId}>
      <div className={styles.content}>
        <div className={styles.pitch}>
          <h2 id={titleId} className={`${styles.title} ${typography.displayMd}`}>
            {reached ? copy.goal.reachedTitle : copy.goal.title}
          </h2>
          <p className={`${styles.subtitle} ${typography.lg}`}>
            {reached ? copy.goal.reachedSubtitle : copy.goal.subtitle(count, GOAL)}
          </p>
          {reached ? reachedAction : action}
        </div>
        <div className={styles.progress}>
          <ProgressDots count={shown} total={GOAL} variant="bars" />
          <p className={typography.lg}>{copy.goal.progress(shown, GOAL)}</p>
        </div>
      </div>
    </section>
  );
}
