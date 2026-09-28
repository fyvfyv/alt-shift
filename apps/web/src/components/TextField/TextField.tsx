import { cx } from 'class-variance-authority';
import { type ComponentProps, useId } from 'react';
import { FieldLabel } from '@components/FieldLabel/FieldLabel';
import controls from '@styles/controls.module.css';
import typography from '@styles/typography.module.css';
import { FieldError } from './FieldError';
import styles from './TextField.module.css';

type TextFieldProps = Omit<ComponentProps<'input'>, 'id' | 'className'> & {
  label: string;
  hideLabel?: boolean;
  error?: string;
};

export function TextField({ label, hideLabel = false, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={controls.field}>
      <FieldLabel htmlFor={id} hidden={hideLabel}>
        {label}
      </FieldLabel>
      <input
        {...inputProps}
        id={id}
        className={cx(controls.control, styles.input, typography.md)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <FieldError id={errorId} error={error} />
    </div>
  );
}
