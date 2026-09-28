import { countChars } from '@alt-shift/shared/generation';
import { cx } from 'class-variance-authority';
import { type ComponentProps, useId } from 'react';
import { CharCounter } from '@components/CharCounter/CharCounter';
import { FieldLabel } from '@components/FieldLabel/FieldLabel';
import controls from '@styles/controls.module.css';
import typography from '@styles/typography.module.css';
import styles from './TextArea.module.css';

type TextAreaProps = Omit<
  ComponentProps<'textarea'>,
  'id' | 'className' | 'value' | 'maxLength'
> & {
  label: string;
  value: string;
  limit: number;
};

export function TextArea({ label, value, limit, ...textareaProps }: TextAreaProps) {
  const id = useId();
  const counterId = `${id}-counter`;
  const count = countChars(value.trim());
  return (
    <div className={cx(controls.field, styles.field)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        {...textareaProps}
        id={id}
        value={value}
        className={cx(controls.control, styles.textarea, typography.md)}
        aria-invalid={count > limit || undefined}
        aria-describedby={counterId}
      />
      <CharCounter id={counterId} count={count} limit={limit} />
    </div>
  );
}
