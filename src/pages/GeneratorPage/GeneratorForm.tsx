import type { ReactNode, Ref } from 'react';
import { countChars, type GenerateRequest, LIMITS } from '../../../shared/generation';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { TextArea } from '../../components/TextArea/TextArea';
import { TextField } from '../../components/TextField/TextField';
import { copy } from '../../copy';
import styles from './GeneratorForm.module.css';

type GeneratorFormProps = {
  values: GenerateRequest;
  onChange: (patch: Partial<GenerateRequest>) => void;
  onSubmit: () => void;
  // Fields stay focusable and selectable while a letter streams, but can't change under it.
  readOnly: boolean;
  cta: ReactNode;
  jobTitleRef: Ref<HTMLInputElement>;
};

function lengthError(value: string): string | undefined {
  return countChars(value.trim()) > LIMITS.singleLine ? copy.generator.fieldTooLong : undefined;
}

export function GeneratorForm({
  values,
  onChange,
  onSubmit,
  readOnly,
  cta,
  jobTitleRef,
}: GeneratorFormProps) {
  const { fields } = copy.generator;
  const jobTitle = values.jobTitle.trim();
  const company = values.company.trim();
  const hasTitle = jobTitle !== '' && company !== '';

  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
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
    </form>
  );
}
