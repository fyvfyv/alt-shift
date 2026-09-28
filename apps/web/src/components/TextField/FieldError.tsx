import { cva } from 'class-variance-authority';
import controls from '@styles/controls.module.css';
import typography from '@styles/typography.module.css';
import utilities from '@styles/utilities.module.css';

const errorVariants = cva(null, {
  variants: {
    shown: { true: [controls.message, typography.sm], false: utilities.visuallyHidden },
  },
});

// A description isn't re-read while typing, so the error also goes through a status, kept mounted
// because one inserted with its text already is skipped.
export function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    <p id={id} role="status" className={errorVariants({ shown: Boolean(error) })} data-error>
      {error}
    </p>
  );
}
