import type { GenerateRequest } from '@alt-shift/shared/types';
import type { GenerationQueue } from '@services/generation/queue';
import type { PreviewState, Run } from '@services/generation/types';
import type { LetterStore } from '@services/letters/types';
import type { ProfileStore } from '@services/profile/types';
import type { EventOf } from '@utils/reducer';

export type FieldName = keyof GenerateRequest;

export type Job = Pick<GenerateRequest, 'jobTitle' | 'company'>;

// Skills and details from a handed-over example or a restored draft: shown where the profile has
// none until the user types there, never written to the profile.
export type Fill = Partial<Pick<GenerateRequest, 'skills' | 'details'>>;

// What the page starts from: a handed-over job, or the tab's draft.
export type Arrival = { job: Job; fill: Fill; runId?: string };

// Which letter this visit to the generator works on.
export type Visit = {
  // The id Generate writes under: kept for Try Again, dropped by an edit, so the next run is new.
  candidateId: string | null;
  // The id of the letter on screen; unlike candidateId an edit keeps it, so its letter stays shown.
  runId: string | null;
  // What Cancel on a queued letter puts back.
  beforeRun: Pick<Visit, 'candidateId' | 'runId'> | null;
  // The title of the letter on screen, taken when a run completes; an edit leaves it behind.
  shownTitle?: string;
};

export type VisitEvents = {
  generate: { id: string };
  cancel: Record<never, never>;
  edit: Record<never, never>;
  reset: Record<never, never>;
  written: { title: string };
};

export type VisitEvent = EventOf<VisitEvents>;

export type FocusRequest = { target: FieldName | 'submit'; preventScroll?: boolean };

export type GeneratorState = {
  job: Job;
  fill: Fill;
  visit: Visit;
  // What the last press on an inert Generate was missing; an edit clears it.
  hint?: string;
  // Where the caret goes next. A new object per request, so asking twice for one place still moves it.
  focus: FocusRequest | null;
  // Counts the runs started here: each one brings the preview into view where it sits below the form.
  reveals: number;
};

export type GeneratorDependencies = {
  queue: GenerationQueue;
  letters: LetterStore;
  profile: ProfileStore;
};

export type LetterOnScreen = {
  run?: Run;
  // The stored letter under the id on screen.
  savedLetter?: string;
  preview: PreviewState;
};

export type CtaKind = 'generate' | 'tryAgain' | 'generating' | 'queued';
