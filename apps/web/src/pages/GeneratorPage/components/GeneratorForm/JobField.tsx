import { countChars, LIMITS } from '@alt-shift/shared/generation';
import { TextField } from '@components/TextField/TextField';
import { copy } from '@copy';
import { isPending } from '@services/generation/selectors';
import { useGeneratorSession } from '../../hooks/useGeneratorSession';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import { useValues } from '../../hooks/useValues';

type JobFieldProps = {
  name: 'jobTitle' | 'company' | 'skills';
  autoComplete: string;
  placeholder?: string;
};

function lengthError(value: string): string | undefined {
  return countChars(value.trim()) > LIMITS.singleLine
    ? copy.generator.fieldTooLong(LIMITS.singleLine)
    : undefined;
}

// A single-line field of the form, bound to the session by name.
export function JobField({ name, autoComplete, placeholder }: JobFieldProps) {
  const session = useGeneratorSession();
  const value = useValues()[name];
  const { preview } = useLetterOnScreen();
  const field = copy.generator.fields[name];
  return (
    <TextField
      name={name}
      label={field.label}
      placeholder={placeholder ?? field.placeholder}
      autoComplete={autoComplete}
      value={value}
      readOnly={isPending(preview)}
      error={lengthError(value)}
      onChange={(event) => session.change(name, event.target.value)}
    />
  );
}
