import type { ReactNode } from 'react';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import styles from './FieldLabel.module.css';

type FieldLabelProps = {
  htmlFor: string;
  hidden?: boolean;
  children: ReactNode;
};

export function FieldLabel({ htmlFor, hidden = false, children }: FieldLabelProps) {
  const className = hidden ? utilities.visuallyHidden : `${styles.label} ${typography.smMedium}`;
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}
