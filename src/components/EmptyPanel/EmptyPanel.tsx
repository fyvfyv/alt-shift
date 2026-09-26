import type { ReactNode } from 'react';
import typography from '../../styles/typography.module.css';
import styles from './EmptyPanel.module.css';

export function EmptyPanel({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className={styles.panel}>
      <p className={typography.lg}>{text}</p>
      {action}
    </div>
  );
}
