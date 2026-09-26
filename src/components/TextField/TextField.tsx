import { type ComponentProps, useId } from 'react';
import controls from '../../styles/controls.module.css';
import typography from '../../styles/typography.module.css';
import { FieldLabel } from '../FieldLabel/FieldLabel';
import styles from './TextField.module.css';

type TextFieldProps = Omit<ComponentProps<'input'>, 'id' | 'className'> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={controls.field}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        {...inputProps}
        id={id}
        className={`${controls.control} ${styles.input} ${typography.md}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className={`${controls.message} ${typography.sm}`} data-error>
          {error}
        </p>
      )}
    </div>
  );
}
