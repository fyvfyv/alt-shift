import { type ComponentProps, useId } from 'react';
import { countChars } from '../../../shared/generation';
import controls from '../../styles/controls.module.css';
import typography from '../../styles/typography.module.css';
import { CharCounter } from '../CharCounter/CharCounter';
import { FieldLabel } from '../FieldLabel/FieldLabel';
import styles from './TextArea.module.css';

type TextAreaProps = Omit<
  ComponentProps<'textarea'>,
  'id' | 'className' | 'value' | 'maxLength'
> & {
  label: string;
  value: string;
  // A soft limit: typing past it is allowed and shown as an error, so pasted text is never cut.
  limit: number;
};

export function TextArea({ label, value, limit, ...textareaProps }: TextAreaProps) {
  const id = useId();
  const counterId = `${id}-counter`;
  const count = countChars(value);
  return (
    <div className={`${controls.field} ${styles.field}`}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        {...textareaProps}
        id={id}
        value={value}
        className={`${controls.control} ${styles.textarea} ${typography.md}`}
        aria-invalid={count > limit || undefined}
        aria-describedby={counterId}
      />
      <CharCounter id={counterId} count={count} limit={limit} />
    </div>
  );
}
