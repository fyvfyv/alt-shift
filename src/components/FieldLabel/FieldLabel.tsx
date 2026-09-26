import type { ReactNode } from 'react';
import typography from '../../styles/typography.module.css';
import styles from './FieldLabel.module.css';

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${typography.smMedium}`}>
      {children}
    </label>
  );
}
