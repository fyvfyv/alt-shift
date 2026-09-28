import { LIMITS } from '@alt-shift/shared/generation';
import { cx } from 'class-variance-authority';
import type { KeyboardEvent, RefObject } from 'react';
import { PageTitle } from '@components/PageTitle/PageTitle';
import { TextArea } from '@components/TextArea/TextArea';
import { copy } from '@copy';
import { useOnline } from '@hooks/useOnline';
import { isPending } from '@services/generation/selectors';
import typography from '@styles/typography.module.css';
import utilities from '@styles/utilities.module.css';
import { useFocusRequests } from '../../hooks/useFocusRequests';
import { useGeneratorSession, useGeneratorStore } from '../../hooks/useGeneratorSession';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import { useValues } from '../../hooks/useValues';
import { noteOf, selectKeptTitle, selectTitle } from '../../session/derive';
import { GenerateButton } from '../GenerateButton/GenerateButton';
import styles from './GeneratorForm.module.css';
import { JobField } from './JobField';

// preventDefault: a single-line field also submits natively on Ctrl+Enter, which would run twice.
function submitOnModifierEnter(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  event.currentTarget.requestSubmit();
}

export function GeneratorForm({ ref }: { ref: RefObject<HTMLFormElement | null> }) {
  const session = useGeneratorSession();
  const { details } = useValues();
  const title = useGeneratorStore(selectTitle);
  const keptTitle = useGeneratorStore(selectKeptTitle);
  const hint = useGeneratorStore((state) => state.hint);
  const { preview } = useLetterOnScreen();
  const note = noteOf(useOnline(), preview, hint);
  const { fields } = copy.generator;
  useFocusRequests(ref);

  return (
    <form
      ref={ref}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        session.generate();
      }}
      onKeyDown={submitOnModifierEnter}
    >
      <PageTitle placeholder={title === undefined}>{title ?? copy.generator.title}</PageTitle>
      <div className={styles.row}>
        <JobField name="jobTitle" autoComplete="organization-title" />
        <JobField
          name="company"
          autoComplete="organization"
          placeholder={keptTitle ? fields.company.nextPlaceholder : undefined}
        />
      </div>
      <JobField name="skills" autoComplete="off" />
      <TextArea
        name="details"
        label={fields.details.label}
        placeholder={fields.details.placeholder}
        value={details}
        limit={LIMITS.details}
        readOnly={isPending(preview)}
        onChange={(event) => session.change('details', event.target.value)}
      />
      <GenerateButton />
      {/* Always mounted: a status is announced when its text changes, not when it is inserted. */}
      <p role="status" className={note ? cx(styles.note, typography.sm) : utilities.visuallyHidden}>
        {note}
      </p>
    </form>
  );
}
