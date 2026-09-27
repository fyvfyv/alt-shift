import type { KeyboardEvent, ReactNode, Ref } from 'react';
import { countChars, type GenerateRequest, LIMITS } from '../../../shared/generation';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { TextArea } from '../../components/TextArea/TextArea';
import { TextField } from '../../components/TextField/TextField';
import { copy } from '../../copy';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import styles from './GeneratorForm.module.css';

type GeneratorFormProps = {
  ref?: Ref<HTMLFormElement>;
  title?: string;
  values: GenerateRequest;
  onChange: (patch: Partial<GenerateRequest>) => void;
  onSubmit: () => void;
  readOnly: boolean;
  cta: ReactNode;
  note?: string;
  jobTitleRef: Ref<HTMLInputElement>;
};

function lengthError(value: string): string | undefined {
  return countChars(value.trim()) > LIMITS.singleLine
    ? copy.generator.fieldTooLong(LIMITS.singleLine)
    : undefined;
}

// preventDefault: a single-line field also submits natively on Ctrl+Enter, which would run twice.
function submitOnModifierEnter(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  event.currentTarget.requestSubmit();
}

export function GeneratorForm({
  ref,
  title,
  values,
  onChange,
  onSubmit,
  readOnly,
  cta,
  note,
  jobTitleRef,
}: GeneratorFormProps) {
  const { fields } = copy.generator;

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
      <PageTitle placeholder={title === undefined}>{title ?? copy.generator.title}</PageTitle>
      <div className={styles.row}>
        <TextField
          ref={jobTitleRef}
          name="jobTitle"
          label={fields.jobTitle.label}
          placeholder={fields.jobTitle.placeholder}
          autoComplete="organization-title"
          value={values.jobTitle}
          readOnly={readOnly}
          error={lengthError(values.jobTitle)}
          onChange={(event) => onChange({ jobTitle: event.target.value })}
        />
        <TextField
          name="company"
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
        name="skills"
        label={fields.skills.label}
        placeholder={fields.skills.placeholder}
        autoComplete="off"
        value={values.skills}
        readOnly={readOnly}
        error={lengthError(values.skills)}
        onChange={(event) => onChange({ skills: event.target.value })}
      />
      <TextArea
        name="details"
        label={fields.details.label}
        placeholder={fields.details.placeholder}
        value={values.details}
        limit={LIMITS.details}
        readOnly={readOnly}
        onChange={(event) => onChange({ details: event.target.value })}
      />
      {cta}
      {/* Always mounted: a status is announced when its text changes, not when it is inserted. */}
      <p
        role="status"
        className={note ? `${styles.note} ${typography.sm}` : utilities.visuallyHidden}
      >
        {note}
      </p>
    </form>
  );
}
