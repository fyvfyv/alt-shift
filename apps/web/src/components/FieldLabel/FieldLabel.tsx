import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import typography from '@styles/typography.module.css';
import utilities from '@styles/utilities.module.css';
import styles from './FieldLabel.module.css';

type FieldLabelProps = {
  htmlFor: string;
  hidden?: boolean;
  children: ReactNode;
};

const labelVariants = cva(null, {
  variants: {
    hidden: { true: utilities.visuallyHidden, false: [styles.label, typography.smMedium] },
  },
});

export function FieldLabel({ htmlFor, hidden = false, children }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={labelVariants({ hidden })}>
      {children}
    </label>
  );
}
