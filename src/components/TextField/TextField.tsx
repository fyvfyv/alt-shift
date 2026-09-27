import { type ComponentProps, useId } from 'react';
import controls from '../../styles/controls.module.css';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import { FieldLabel } from '../FieldLabel/FieldLabel';
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
        className={`${controls.control} ${styles.input} ${typography.md}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {/* A description isn't re-read while typing, so the error also goes through a status,
          kept mounted because one inserted with its text already is skipped. */}
      <p
        id={errorId}
        role="status"
        className={error ? `${controls.message} ${typography.sm}` : utilities.visuallyHidden}
        data-error
      >
        {error}
      </p>
    </div>
  );
}
