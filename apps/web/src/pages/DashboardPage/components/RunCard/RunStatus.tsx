import { cx } from 'class-variance-authority';
import type { ReactNode } from 'react';
import type { Run } from '@services/generation/types';
import typography from '@styles/typography.module.css';
import styles from './RunCard.module.css';
import { runTitle } from './runView';

// A card with no letter text to show: its title, and a line on where the letter stands.
export function RunStatus({ run, children }: { run: Run; children: ReactNode }) {
  return (
    <div className={styles.status}>
      <p className={cx(styles.title, typography.mdStrong)}>{runTitle(run)}</p>
      <p className={cx(styles.note, typography.sm)}>{children}</p>
    </div>
  );
}
