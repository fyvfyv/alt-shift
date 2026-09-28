import { cx } from 'class-variance-authority';
import type { ReactNode } from 'react';
import typography from '@styles/typography.module.css';
import styles from './EmptyPanel.module.css';

type EmptyPanelProps = {
  heading?: string;
  text: string;
  note?: string;
  action: ReactNode;
};

export function EmptyPanel({ heading, text, note, action }: EmptyPanelProps) {
  return (
    <div className={styles.panel}>
      {heading && <p className={cx(styles.heading, typography.lgStrong)}>{heading}</p>}
      <p className={typography.lg}>{text}</p>
      {action}
      {note && <p className={cx(styles.note, typography.sm)}>{note}</p>}
    </div>
  );
}
