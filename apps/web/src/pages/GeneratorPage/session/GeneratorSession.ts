import { generateRequestSchema } from '@alt-shift/shared/generation';
import type { GenerateRequest } from '@alt-shift/shared/types';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { copy } from '@copy';
import type { GenerationQueue } from '@services/generation/queue';
import { isPending, keptLetter } from '@services/generation/selectors';
import type { LetterStore } from '@services/letters/types';
import type { ProfileStore } from '@services/profile/types';
import { isJobField, previewOf, requestOf, retryAtOf, validationHint } from './derive';
import { arrivalOf, storedDraft } from './draft';
import type {
  FieldName,
  FocusRequest,
  GeneratorDependencies,
  GeneratorState,
  LetterOnScreen,
  VisitEvent,
} from './types';
import { visitReducer } from './visit';

// One visit to the generator: the job in the form, the letter on screen, and what the page's
// buttons do. The letters it asks for belong to the queue and outlive it.
export class GeneratorSession {
  readonly store: StoreApi<GeneratorState>;
  readonly #queue: GenerationQueue;
  readonly #letters: LetterStore;
  readonly #profile: ProfileStore;
  // The letter the draft's job was handed to.
  #handedTo: string | undefined;
  // The run of the letter on screen last seen written, so each one is taken once.
  #writtenKey: string | undefined;

  constructor({ queue, letters, profile }: GeneratorDependencies, prefill: unknown) {
    this.#queue = queue;
    this.#letters = letters;
    this.#profile = profile;
    const arrival = arrivalOf(prefill, (runId) => this.#claimed(runId));
    this.#handedTo = arrival.runId;
    this.store = createStore<GeneratorState>()(() => ({
      job: arrival.job,
      fill: arrival.fill,
      // A restored draft whose letter never got written takes its id back: Generate replaces it.
      visit: { candidateId: arrival.runId ?? null, runId: null, beforeRun: null },
      focus: null,
      reveals: 0,
    }));
  }

  // Writes the arrival to the tab's draft, and watches the queue for the letter on screen to be written.
  connect(): () => void {
    this.#saveDraft();
    return this.#queue.store.subscribe(() => this.#noticeWritten());
  }

  change = (name: FieldName, value: string) => {
    if (isJobField(name)) {
      this.store.setState(({ job }) => ({ job: { ...job, [name]: value } }));
    } else {
      this.#profile.getState().update({ [name]: value });
      this.store.setState(({ fill }) => ({ fill: { ...fill, [name]: undefined } }));
    }
    this.#visit({ type: 'edit' });
    this.store.setState({ hint: undefined });
    this.#handedTo = undefined;
    this.#saveDraft();
  };

  generate = () => {
    const { preview } = this.#onScreen();
    // The CTA keeps focus while loading instead of going disabled, so a submit can still arrive.
    if (isPending(preview)) return;
    const values = requestOf(this.store.getState(), this.#profile.getState());
    const request = generateRequestSchema.safeParse(values);
    if (!request.success) {
      this.#explain(values);
      return;
    }
    if (!navigator.onLine || Date.now() < (retryAtOf(preview) ?? 0)) return;
    const { candidateId, runId } = this.store.getState().visit;
    const id = candidateId ?? crypto.randomUUID();
    if (id !== runId) this.#dropFailedCandidate();
    this.#visit({ type: 'generate', id });
    this.store.setState(({ reveals }) => ({ reveals: reveals + 1 }));
    this.#queue.enqueue({ id, request: request.data, previous: keptLetter(preview) });
    this.#handedTo = id;
    this.#saveDraft();
  };

  // The panel's own button unmounts as the run starts, so focus moves to the CTA first.
  retryFromPanel = () => {
    this.requestFocus({ target: 'submit' });
    this.generate();
  };

  cancelQueued = () => {
    const { runId } = this.store.getState().visit;
    if (runId !== null) this.#queue.remove(runId);
    this.#visit({ type: 'cancel' });
    this.requestFocus({ target: 'submit' });
  };

  nextCompany = () => {
    this.change('company', '');
    this.requestFocus({ target: 'company' });
  };

  // Keeps the profile; a handed-over example goes with the job.
  startNew = () => {
    this.#dropFailedCandidate();
    this.#visit({ type: 'reset' });
    this.store.setState({ job: { jobTitle: '', company: '' }, fill: {}, hint: undefined });
    this.requestFocus({ target: 'jobTitle', preventScroll: true });
    this.#handedTo = undefined;
    this.#saveDraft();
    window.scrollTo({ top: 0 });
  };

  requestFocus(focus: FocusRequest) {
    this.store.setState({ focus });
  }

  #visit(event: VisitEvent) {
    this.store.setState(({ visit }) => ({ visit: visitReducer(visit, event) }));
    this.#noticeWritten();
  }

  #onScreen(): LetterOnScreen {
    const { runId } = this.store.getState().visit;
    const run = this.#queue.store.getState().runs.find((r) => r.id === runId);
    const savedLetter = this.#letters.getState().letters.find((l) => l.id === runId)?.text;
    return { run, savedLetter, preview: previewOf(run, savedLetter) };
  }

  // Once the letter on screen is written, its title stays with it and the tab's draft is done.
  #noticeWritten() {
    const { run } = this.#onScreen();
    const key = run?.state.status === 'completed' ? run.key : undefined;
    if (key === this.#writtenKey) return;
    this.#writtenKey = key;
    if (!run || key === undefined) return;
    const title = copy.letter.title(run.request.jobTitle, run.request.company);
    this.store.setState(({ visit }) => ({
      visit: visitReducer(visit, { type: 'written', title }),
    }));
    this.#handedTo = undefined;
    storedDraft.clear();
  }

  // Moving on from a letter that was never written drops it, so it isn't left as a failed card.
  #dropFailedCandidate() {
    const { runId } = this.store.getState().visit;
    const { preview, savedLetter } = this.#onScreen();
    if (runId !== null && preview.status === 'error' && savedLetter === undefined) {
      this.#queue.remove(runId);
    }
  }

  // A press on an inert Generate says what to fix and puts the caret there; an edit clears it.
  #explain(values: GenerateRequest) {
    const { hint, field } = validationHint(values);
    this.store.setState({ hint });
    if (field) this.requestFocus({ target: field });
  }

  #claimed(runId: string): boolean {
    return (
      this.#letters.getState().letters.some((letter) => letter.id === runId) ||
      this.#queue.store.getState().runs.some((run) => run.id === runId && isPending(run.state))
    );
  }

  #saveDraft() {
    const { job, fill } = this.store.getState();
    storedDraft.write({
      ...job,
      skills: fill.skills ?? '',
      details: fill.details ?? '',
      runId: this.#handedTo ?? '',
    });
  }
}
