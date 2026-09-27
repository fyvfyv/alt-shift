import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  countChars,
  type GenerateRequest,
  LIMITS,
  validateGenerateRequest,
} from '../../../shared/generation';
import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { GoalBanner } from '../../components/GoalBanner/GoalBanner';
import { copy } from '../../copy';
import { keptLetter } from '../../features/generation/generationReducer';
import { useCountdown } from '../../features/generation/useCountdown';
import { useGeneration } from '../../features/generation/useGeneration';
import { useGeneratorFields } from '../../features/generation/useGeneratorFields';
import { useOnline } from '../../features/generation/useOnline';
import {
  useGeneratedCount,
  useLetterStore,
  useStorageFailed,
} from '../../features/letters/LetterStoreProvider';
import { createLetter } from '../../features/letters/model';
import utilities from '../../styles/utilities.module.css';
import { GeneratorForm } from './GeneratorForm';
import styles from './GeneratorPage.module.css';
import { LetterPreview } from './LetterPreview';
import { statusMessage } from './previewStatus';

const TOUCH_ONLY = '(hover: none) and (pointer: coarse)';

const REQUIRED = ['jobTitle', 'company', 'skills'] as const;
const FIELDS = [...REQUIRED, 'details'] as const;

function blockingFields(values: GenerateRequest) {
  return {
    missing: REQUIRED.filter((field) => values[field].trim() === ''),
    tooLong: FIELDS.filter((field) => {
      const limit = field === 'details' ? LIMITS.details : LIMITS.singleLine;
      return countChars(values[field].trim()) > limit;
    }),
  };
}

export function GeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill: unknown = location.state?.prefill;
  const { values, update, resetJob, forgetJob, profile, setName } = useGeneratorFields({
    prefill,
  });
  const jobTitle = values.jobTitle.trim();
  const company = values.company.trim();
  const letterTitle = jobTitle && company ? copy.letter.title(jobTitle, company) : undefined;
  usePageMeta(letterTitle ?? copy.generator.title);
  const { state, generate, abort } = useGeneration();
  const addLetter = useLetterStore((s) => s.add);
  const storageFailed = useStorageFailed();
  const count = useGeneratedCount();
  const online = useOnline();
  const formRef = useRef<HTMLFormElement>(null);
  const jobTitleRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const [hint, setHint] = useState<string>();

  const [candidateId, setCandidateId] = useState<string | null>(null);
  // The id the last run wrote under; unlike candidateId an edit keeps it, so its letter stays shown.
  const [runId, setRunId] = useState<string | null>(null);
  const savedLetter = useLetterStore((s) =>
    runId === null ? undefined : s.letters.find((l) => l.id === runId)?.text,
  );
  const [shownTitle, setShownTitle] = useState<string>();

  // After usePageMeta: effects run in declaration order, so this focus wins over its h1 focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on arrival
  useEffect(() => {
    if (prefill !== undefined) void navigate(location.pathname, { replace: true, state: null });
    const jobEmpty = values.jobTitle === '' && values.company === '';
    if (jobEmpty && !window.matchMedia(TOUCH_ONLY).matches) {
      jobTitleRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const rateLimit =
    state.status === 'error' && state.error.kind === 'rate-limit' ? state.error : null;
  const retryCountdown = useCountdown(rateLimit?.retryAfterSeconds ?? 0, rateLimit);

  const busy = state.status === 'loading' || state.status === 'streaming';
  const hasLetter =
    state.status === 'completed' || (state.status === 'error' && state.text !== undefined);
  const hasSavedLetter = keptLetter(state, savedLetter) !== undefined;
  const tryAgain = candidateId !== null && (hasLetter || savedLetter !== undefined);
  const keptTitle = shownTitle !== letterTitle ? shownTitle : undefined;
  const blocked = retryCountdown > 0 || !online;
  const canGenerate = validateGenerateRequest(values).ok && !blocked;
  const previewSaysOffline = state.status === 'error' && state.error.kind === 'network';

  function explainInvalid() {
    const { missing, tooLong } = blockingFields(values);
    const messages = copy.generator.hint;
    setHint(
      missing.length > 0
        ? messages.missing(missing.map((field) => messages.names[field]))
        : messages.tooLong,
    );
    const first = missing[0] ?? tooLong[0];
    const field = first && formRef.current?.elements.namedItem(first);
    if (field instanceof HTMLElement) field.focus();
  }

  async function run() {
    // The CTA keeps focus while loading instead of going disabled, so a submit can still arrive.
    if (busy) return;
    const request = validateGenerateRequest(values);
    if (!request.ok) {
      explainInvalid();
      return;
    }
    if (blocked) return;
    const id = candidateId ?? crypto.randomUUID();
    setCandidateId(id);
    setRunId(id);
    const form = formRef.current;
    const preview = previewRef.current;
    if (form && preview && preview.offsetTop > form.offsetTop) {
      preview.scrollIntoView({ block: 'start' });
    }

    const text = await generate(request.value);
    if (text === undefined) return;
    setShownTitle(copy.letter.title(request.value.jobTitle, request.value.company));
    forgetJob();
    await addLetter(
      createLetter({ id, jobTitle: request.value.jobTitle, company: request.value.company, text }),
    );
  }

  // The panel button unmounts as the run starts, dropping focus to the body; hand it to the CTA.
  function retryFromPanel() {
    formRef.current
      ?.querySelector<HTMLElement>('button[type="submit"]')
      ?.focus({ preventScroll: true });
    void run();
  }

  function handleChange(patch: Partial<GenerateRequest>) {
    update(patch);
    setCandidateId(null);
    setHint(undefined);
  }

  function nextCompany() {
    handleChange({ company: '' });
    const company = formRef.current?.elements.namedItem('company');
    if (company instanceof HTMLElement) company.focus();
  }

  function startNew() {
    abort();
    resetJob();
    setCandidateId(null);
    setRunId(null);
    setHint(undefined);
    jobTitleRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  // aria-disabled, never disabled: presses must reach run(), and a disabled button drops focus.
  const ctaProps = {
    type: 'submit',
    fullWidth: true,
    'aria-keyshortcuts': 'Control+Enter Meta+Enter',
  } as const;
  let cta: ReactNode;
  if (busy) {
    cta = (
      <Button {...ctaProps} loading>
        {copy.generator.generating}
      </Button>
    );
  } else if (tryAgain) {
    cta = (
      <Button
        {...ctaProps}
        variant="secondary"
        iconLeading="repeat-03"
        aria-disabled={!canGenerate || undefined}
      >
        {copy.generator.tryAgain}
      </Button>
    );
  } else {
    cta = (
      <Button {...ctaProps} aria-disabled={!canGenerate || undefined}>
        {copy.generator.generate}
      </Button>
    );
  }

  const createNew = (
    <Button iconLeading="plus" onClick={startNew}>
      {copy.createNew}
    </Button>
  );

  return (
    <>
      <div className={styles.body}>
        <GeneratorForm
          ref={formRef}
          title={letterTitle}
          values={values}
          onChange={handleChange}
          onSubmit={() => void run()}
          readOnly={busy}
          cta={cta}
          note={!online && !previewSaysOffline ? copy.generator.offlineNote : hint}
          companyPlaceholder={keptTitle ? copy.generator.nextCompany : undefined}
          jobTitleRef={jobTitleRef}
        />
        <LetterPreview
          ref={previewRef}
          state={state}
          company={company}
          retryCountdown={retryCountdown}
          retryDisabled={!canGenerate}
          onRetry={retryFromPanel}
          showCutRetry={tryAgain}
          savedLetter={savedLetter}
          keptTitle={keptTitle}
          storageFailed={storageFailed}
          name={profile.name}
          onNameChange={setName}
          onNextCompany={nextCompany}
        />
      </div>
      <p role="status" className={utilities.visuallyHidden}>
        {statusMessage(state, savedLetter !== undefined)}
      </p>
      {hasSavedLetter && <GoalBanner count={count} action={createNew} reachedAction={createNew} />}
    </>
  );
}
