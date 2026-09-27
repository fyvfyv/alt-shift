import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { type GenerateRequest, validateGenerateRequest } from '../../../shared/generation';
import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { GoalBanner } from '../../components/GoalBanner/GoalBanner';
import { copy } from '../../copy';
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
import { GeneratorForm } from './GeneratorForm';
import styles from './GeneratorPage.module.css';
import { LetterPreview } from './LetterPreview';

// Below this width focusing a field opens the keyboard, so arriving must not grab it.
const FOCUS_ON_ARRIVAL_MIN_WIDTH = 768;

const FIELDS = ['jobTitle', 'company', 'skills', 'details'] as const;

// A link can hand a job over through history state (`state.prefill`). The job fields always
// take it (the link is the user's choice); the profile fields only when still empty, so a saved
// bio is never replaced by an example.
function prefillPatch(state: unknown, current: GenerateRequest): Partial<GenerateRequest> {
  const prefill: unknown = (state as { prefill?: unknown } | null)?.prefill;
  if (typeof prefill !== 'object' || prefill === null) return {};
  const patch: Partial<GenerateRequest> = {};
  for (const field of FIELDS) {
    const value = (prefill as Record<string, unknown>)[field];
    const isJobField = field === 'jobTitle' || field === 'company';
    if (typeof value === 'string' && (isJobField || current[field] === '')) patch[field] = value;
  }
  return patch;
}

export function GeneratorPage() {
  usePageMeta(copy.generator.title);
  const { state: locationState } = useLocation();
  const { values, update, resetJob, forgetJob, profile, setName } = useGeneratorFields();
  const { state, generate, abort } = useGeneration();
  const addLetter = useLetterStore((s) => s.add);
  const storageFailed = useStorageFailed();
  const count = useGeneratedCount();
  const online = useOnline();
  const formRef = useRef<HTMLFormElement>(null);
  const jobTitleRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // One visit produces one candidate letter: Try Again and Retry regenerate it in place (same
  // id), so a failed attempt never inflates the count; only an edit starts a new one.
  const letterId = useRef<string | null>(null);
  const [editedSinceRun, setEditedSinceRun] = useState(false);

  // Arrival: take the hand-over, then put the caret where typing starts. Declared after
  // usePageMeta so the field wins over its h1 focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on arrival
  useEffect(() => {
    const patch = prefillPatch(locationState, values);
    if (Object.keys(patch).length > 0) update(patch);
    const jobEmpty =
      (patch.jobTitle ?? values.jobTitle) === '' && (patch.company ?? values.company) === '';
    if (jobEmpty && window.innerWidth >= FOCUS_ON_ARRIVAL_MIN_WIDTH) {
      jobTitleRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const rateLimit =
    state.status === 'error' && state.error.kind === 'rate-limit' ? state.error : null;
  const retryCountdown = useCountdown(rateLimit?.retryAfterSeconds ?? 0, rateLimit);

  const busy = state.status === 'loading' || state.status === 'streaming';
  const hasLetter =
    state.status === 'completed' || (state.status === 'error' && state.error.kind === 'stream-cut');
  const tryAgain = hasLetter && !editedSinceRun;
  const blocked = retryCountdown > 0 || !online;
  const canGenerate = validateGenerateRequest(values).ok && !blocked;
  const previewSaysOffline = state.status === 'error' && state.error.kind === 'network';

  async function run() {
    // The CTA keeps focus while loading instead of going disabled, so a submit can still arrive.
    if (busy) return;
    const request = validateGenerateRequest(values);
    if (!request.ok || blocked) return;
    if (editedSinceRun || letterId.current === null) letterId.current = crypto.randomUUID();
    const id = letterId.current;
    setEditedSinceRun(false);
    // Stacked, the preview starts below the fold: bring it up so the stream is visible.
    const form = formRef.current;
    const preview = previewRef.current;
    if (form && preview && preview.offsetTop > form.offsetTop) {
      preview.scrollIntoView({ block: 'start' });
    }

    const text = await generate(request.value);
    if (text === undefined) return;
    forgetJob();
    await addLetter(
      createLetter({ id, jobTitle: request.value.jobTitle, company: request.value.company, text }),
    );
  }

  function handleChange(patch: Partial<GenerateRequest>) {
    update(patch);
    setEditedSinceRun(true);
  }

  // The next letter is for another job; what the user is good at stays.
  function startNew() {
    abort();
    resetJob();
    letterId.current = null;
    setEditedSinceRun(false);
    jobTitleRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

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
      <Button {...ctaProps} variant="secondary" iconLeading="repeat-03" disabled={blocked}>
        {copy.generator.tryAgain}
      </Button>
    );
  } else {
    cta = (
      <Button {...ctaProps} disabled={!canGenerate}>
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
          values={values}
          onChange={handleChange}
          onSubmit={() => void run()}
          readOnly={busy}
          cta={cta}
          note={!online && !previewSaysOffline ? copy.generator.offlineNote : undefined}
          jobTitleRef={jobTitleRef}
        />
        <LetterPreview
          ref={previewRef}
          state={state}
          company={values.company.trim()}
          retryCountdown={retryCountdown}
          retryDisabled={!canGenerate}
          onRetry={() => void run()}
          storageFailed={storageFailed}
          name={profile.name}
          onNameChange={setName}
        />
      </div>
      {state.status === 'completed' && (
        <GoalBanner count={count} action={createNew} reachedAction={createNew} />
      )}
    </>
  );
}
