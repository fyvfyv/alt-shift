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

// On a touch-only device focusing a field opens the on-screen keyboard, so arriving must not
// grab it. Input modality, not width: a tablet is wide, a narrow desktop window has a keyboard.
const TOUCH_ONLY = '(hover: none) and (pointer: coarse)';

const REQUIRED = ['jobTitle', 'company', 'skills'] as const;
const FIELDS = [...REQUIRED, 'details'] as const;

// The fields that keep the request from passing validation, in form order: the validator's own
// rules, kept per field so the hint can name them.
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
  // One rule for the h1 and the tab: the job, once both parts are filled in.
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
  // What the inert CTA said when pressed; the next edit clears it.
  const [hint, setHint] = useState<string>();

  // One visit produces one candidate letter: Try Again and Retry regenerate it in place (same
  // id), so a failed attempt never inflates the count; only an edit starts a new one.
  // The id the next run writes under; null means a new letter.
  const [candidateId, setCandidateId] = useState<string | null>(null);
  // The id the last run wrote under. Unlike the candidate, an edit keeps it: the letter that run
  // was regenerating stays on screen until the next run.
  const [runId, setRunId] = useState<string | null>(null);
  // Asked of the store, not of the preview state: a cut Try Again drops the saved letter from the
  // state, yet it stays on screen, and the next run must still replace it, not add a new one.
  const savedLetter = useLetterStore((s) =>
    runId === null ? undefined : s.letters.find((l) => l.id === runId)?.text,
  );
  // The job of the last letter that finished. After an edit, a run that fails before any text
  // keeps that letter on screen under the form's new title, so the note has to name it.
  const [shownTitle, setShownTitle] = useState<string>();

  // Arrival: put the caret where typing starts, and drop the hand-over from history so a reload
  // or Back never applies it again over later edits (the tab's draft has it by then).
  // Declared after usePageMeta so the field wins over its h1 focus.
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
  // A letter on screen: complete, cut short, or the previous one kept through a regenerate that
  // failed before any text. After an edit the next run is a new letter; if it fails before any
  // text, the letter still shown is the previous one, which is what the note above it says.
  const hasLetter =
    state.status === 'completed' || (state.status === 'error' && state.text !== undefined);
  const hasSavedLetter = keptLetter(state, savedLetter) !== undefined;
  // While there is a candidate, the last run wrote under its id, so `savedLetter` is its letter.
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
    // Offline or counting down: the note or the countdown already says why.
    if (blocked) return;
    const id = candidateId ?? crypto.randomUUID();
    setCandidateId(id);
    setRunId(id);
    // Stacked, the preview starts below the fold: bring it up so the stream is visible.
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

  // The panel's Retry and Try Again give way to the orb as the run starts, which would drop the
  // caret to the top of the page; the CTA stays mounted, turning busy, so it takes the focus.
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

  // The next letter is for another job; what the user is good at stays.
  function startNew() {
    abort();
    resetJob();
    setCandidateId(null);
    setRunId(null);
    setHint(undefined);
    jobTitleRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  // aria-disabled, never disabled: the same gray, but a click or Enter still reaches run(), which
  // says what is missing, and a CTA blocked under the caret (a countdown, going offline) keeps
  // keyboard focus instead of dropping it at the top of the page.
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
        />
      </div>
      {/* The one line a screen reader hears as a run starts, finishes or is cut: the panel is not
          live, so the letter is never read out as it streams. */}
      <p role="status" className={utilities.visuallyHidden}>
        {statusMessage(state, savedLetter !== undefined)}
      </p>
      {hasSavedLetter && <GoalBanner count={count} action={createNew} reachedAction={createNew} />}
    </>
  );
}
