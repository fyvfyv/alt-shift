import type { ReactNode } from 'react';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import styles from './FieldLabel.module.css';

type FieldLabelProps = {
  htmlFor: string;
  // Off screen but still the field's accessible name: for a field whose purpose the UI around it
  // already shows, where a visible label would only add height.
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
