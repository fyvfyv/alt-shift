import { type ReactNode, useRef, useState } from 'react';
import { type GenerateRequest, validateGenerateRequest } from '../../../shared/generation';
import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { GoalBanner } from '../../components/GoalBanner/GoalBanner';
import { PageShell } from '../../components/PageShell/PageShell';
import { copy } from '../../copy';
import { useCountdown } from '../../features/generation/useCountdown';
import { useDraft } from '../../features/generation/useDraft';
import { useGeneration } from '../../features/generation/useGeneration';
import { useOnline } from '../../features/generation/useOnline';
import { useGeneratedCount, useLetterStore } from '../../features/letters/LetterStoreProvider';
import { createLetter } from '../../features/letters/model';
import { GeneratorForm } from './GeneratorForm';
import styles from './GeneratorPage.module.css';
import { LetterPreview } from './LetterPreview';

const emptyFields: GenerateRequest = { jobTitle: '', company: '', skills: '', details: '' };

// Mirrors the `@container page (width < 1120px)` rule that stacks the preview under the form.
const STACKED_BELOW = 1120;

export function GeneratorPage() {
  usePageMeta(copy.generator.title);
  const { draft, update, clear } = useDraft();
  const { state, generate, abort } = useGeneration();
  const addLetter = useLetterStore((s) => s.add);
  const storageFailed = useLetterStore((s) => s.lastStorageError !== null);
  const count = useGeneratedCount();
  const online = useOnline();
  const jobTitleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // One visit produces one candidate letter: Try Again and Retry regenerate it in place (same
  // id), so a failed attempt never inflates the count; only an edit starts a new one.
  const letterId = useRef<string | null>(null);
  const [editedSinceRun, setEditedSinceRun] = useState(false);

  const rateLimit =
    state.status === 'error' && state.error.kind === 'rate-limit' ? state.error : null;
  const retryCountdown = useCountdown(rateLimit?.retryAfterSeconds ?? 0, rateLimit);

  const busy = state.status === 'loading' || state.status === 'streaming';
  const hasLetter =
    state.status === 'completed' || (state.status === 'error' && state.error.kind === 'stream-cut');
  const tryAgain = hasLetter && !editedSinceRun;
  const blocked = retryCountdown > 0 || !online;
  const canGenerate = validateGenerateRequest(draft).ok && !blocked;

  async function run() {
    const request = validateGenerateRequest(draft);
    if (!request.ok || blocked) return;
    if (editedSinceRun || letterId.current === null) letterId.current = crypto.randomUUID();
    const id = letterId.current;
    setEditedSinceRun(false);
    // Stacked, the preview starts below the fold: bring it up so the stream is visible.
    const body = bodyRef.current;
    if (body && body.offsetWidth < STACKED_BELOW) {
      previewRef.current?.scrollIntoView({ block: 'start' });
    }

    const text = await generate(request.value);
    if (text === undefined) return;
    clear();
    await addLetter(
      createLetter({ id, jobTitle: request.value.jobTitle, company: request.value.company, text }),
    );
  }

  function handleChange(patch: Partial<GenerateRequest>) {
    update(patch);
    setEditedSinceRun(true);
  }

  function startNew() {
    abort();
    update(emptyFields);
    clear();
    letterId.current = null;
    setEditedSinceRun(false);
    jobTitleRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  let cta: ReactNode;
  if (busy) {
    cta = (
      <Button type="submit" fullWidth loading>
        {copy.generator.generating}
      </Button>
    );
  } else if (tryAgain) {
    cta = (
      <Button
        type="submit"
        variant="secondary"
        fullWidth
        iconLeading="repeat-03"
        disabled={blocked}
      >
        {copy.generator.tryAgain}
      </Button>
    );
  } else {
    cta = (
      <Button type="submit" fullWidth disabled={!canGenerate}>
        {copy.generator.generate}
      </Button>
    );
  }

  return (
    <PageShell>
      <div ref={bodyRef} className={styles.body}>
        <GeneratorForm
          values={draft}
          onChange={handleChange}
          onSubmit={() => void run()}
          readOnly={busy}
          cta={cta}
          jobTitleRef={jobTitleRef}
        />
        <LetterPreview
          ref={previewRef}
          state={state}
          retryCountdown={retryCountdown}
          retryDisabled={!canGenerate}
          onRetry={() => void run()}
          storageFailed={storageFailed}
        />
      </div>
      {state.status === 'completed' && (
        <GoalBanner
          count={count}
          action={
            <Button iconLeading="plus" onClick={startNew}>
              {copy.createNew}
            </Button>
          }
        />
      )}
    </PageShell>
  );
}
