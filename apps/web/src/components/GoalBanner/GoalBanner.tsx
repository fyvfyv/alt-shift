import { cx } from 'class-variance-authority';
import { type ReactNode, useId } from 'react';
import { GOAL } from '@services/letters/model';
import typography from '@styles/typography.module.css';
import styles from './GoalBanner.module.css';
import { GoalProgress } from './GoalProgress';
import { goalPitch } from './goalPitch';

type GoalBannerProps = {
  count: number;
  action: ReactNode;
  reachedAction?: ReactNode;
};

export function GoalBanner({ count, action, reachedAction }: GoalBannerProps) {
  const titleId = useId();
  const reached = count >= GOAL;
  if (reached && !reachedAction) return null;
  const { title, subtitle } = goalPitch(count);
  return (
    <section className={styles.banner} aria-labelledby={titleId}>
      <div className={styles.content}>
        <div className={styles.pitch}>
          <h2 id={titleId} className={cx(styles.title, typography.displayMd)}>
            {title}
          </h2>
          <p className={cx(styles.subtitle, typography.lg)}>{subtitle}</p>
          {reached ? reachedAction : action}
        </div>
        <GoalProgress count={Math.min(count, GOAL)} />
      </div>
    </section>
  );
}
