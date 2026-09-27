import type { KeyboardEvent, ReactNode, Ref } from 'react';
import { countChars, type GenerateRequest, LIMITS } from '../../../shared/generation';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { TextArea } from '../../components/TextArea/TextArea';
import { TextField } from '../../components/TextField/TextField';
import { copy } from '../../copy';
import typography from '../../styles/typography.module.css';
import styles from './GeneratorForm.module.css';

type GeneratorFormProps = {
  ref?: Ref<HTMLFormElement>;
  values: GenerateRequest;
  onChange: (patch: Partial<GenerateRequest>) => void;
  onSubmit: () => void;
  // Fields stay focusable and selectable while a letter streams, but can't change under it.
  readOnly: boolean;
  cta: ReactNode;
  // One line under the CTA for whatever keeps it from working right now.
  note?: string;
  jobTitleRef: Ref<HTMLInputElement>;
};

function lengthError(value: string): string | undefined {
  return countChars(value.trim()) > LIMITS.singleLine
    ? copy.generator.fieldTooLong(LIMITS.singleLine)
    : undefined;
}

// Enter alone already submits from the single-line fields; the modifier makes it work from the
// textarea too, and preventDefault keeps the browser's own submission from doubling it.
function submitOnModifierEnter(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  event.currentTarget.requestSubmit();
}

export function GeneratorForm({
  ref,
  values,
  onChange,
  onSubmit,
  readOnly,
  cta,
  note,
  jobTitleRef,
}: GeneratorFormProps) {
  const { fields } = copy.generator;
  const jobTitle = values.jobTitle.trim();
  const company = values.company.trim();
  const hasTitle = jobTitle !== '' && company !== '';

  return (
    <form
      ref={ref}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      onKeyDown={submitOnModifierEnter}
    >
      <PageTitle placeholder={!hasTitle}>
        {hasTitle ? copy.letter.title(jobTitle, company) : copy.generator.title}
      </PageTitle>
      <div className={styles.row}>
        <TextField
          ref={jobTitleRef}
          label={fields.jobTitle.label}
          placeholder={fields.jobTitle.placeholder}
          autoComplete="organization-title"
          value={values.jobTitle}
          readOnly={readOnly}
          error={lengthError(values.jobTitle)}
          onChange={(event) => onChange({ jobTitle: event.target.value })}
        />
        <TextField
          label={fields.company.label}
          placeholder={fields.company.placeholder}
          autoComplete="organization"
          value={values.company}
          readOnly={readOnly}
          error={lengthError(values.company)}
          onChange={(event) => onChange({ company: event.target.value })}
        />
      </div>
      <TextField
        label={fields.skills.label}
        placeholder={fields.skills.placeholder}
        autoComplete="off"
        value={values.skills}
        readOnly={readOnly}
        error={lengthError(values.skills)}
        onChange={(event) => onChange({ skills: event.target.value })}
      />
      <TextArea
        label={fields.details.label}
        placeholder={fields.details.placeholder}
        value={values.details}
        limit={LIMITS.details}
        readOnly={readOnly}
        onChange={(event) => onChange({ details: event.target.value })}
      />
      {cta}
      {note && (
        <p className={`${styles.note} ${typography.sm}`} aria-live="polite">
          {note}
        </p>
      )}
    </form>
  );
}
