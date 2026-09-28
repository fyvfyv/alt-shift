import { generateRequestSchema } from '@alt-shift/shared/generation';
import type { GenerateRequest } from '@alt-shift/shared/types';
import { copy } from '@copy';
import { initialPreviewState } from '@services/generation/generationReducer';
import { isPending } from '@services/generation/selectors';
import type { PreviewState, Run } from '@services/generation/types';
import type { Profile } from '@services/profile/types';
import type { CtaKind, FieldName, GeneratorState, Job } from './types';

export function isJobField(name: FieldName): name is keyof Job {
  return name === 'jobTitle' || name === 'company';
}

// Skills and details are the profile's; until the user types there, the fill stands in.
export function requestOf(
  { job, fill }: Pick<GeneratorState, 'job' | 'fill'>,
  profile: Pick<Profile, 'skills' | 'details'>,
): GenerateRequest {
  return {
    ...job,
    skills: profile.skills || fill.skills || '',
    details: profile.details || fill.details || '',
  };
}

export function titleOf({ jobTitle, company }: Job) {
  const job = jobTitle.trim();
  const at = company.trim();
  return job && at ? copy.letter.title(job, at) : undefined;
}

export function selectTitle(state: GeneratorState) {
  return titleOf(state.job);
}

// The title of the letter on screen once the form has moved on to another job.
export function selectKeptTitle({ visit, job }: GeneratorState) {
  return visit.shownTitle !== titleOf(job) ? visit.shownTitle : undefined;
}

// The run under the id on screen, or once the queue has let it go (a cancelled Try Again), its
// saved letter.
export function previewOf(run: Run | undefined, savedLetter: string | undefined): PreviewState {
  if (run) return run.state;
  return savedLetter === undefined
    ? initialPreviewState
    : { status: 'completed', text: savedLetter };
}

export function retryAtOf(preview: PreviewState): number | undefined {
  return preview.status === 'error' && preview.error.kind === 'rate-limit'
    ? preview.error.retryAt
    : undefined;
}

export function hasLetter(preview: PreviewState): boolean {
  return (
    preview.status === 'completed' || (preview.status === 'error' && preview.text !== undefined)
  );
}

// Try Again while this visit's letter is on screen or saved; any edit makes the next run new.
export function ctaOf(preview: PreviewState, canTryAgain: boolean): CtaKind {
  if (preview.status === 'queued') return 'queued';
  if (isPending(preview)) return 'generating';
  return canTryAgain ? 'tryAgain' : 'generate';
}

// Offline says so, unless the preview already shows the offline error.
export function noteOf(online: boolean, preview: PreviewState, hint?: string) {
  const previewSaysOffline = preview.status === 'error' && preview.error.kind === 'network';
  return !online && !previewSaysOffline ? copy.generator.offlineNote : hint;
}

type NamedField = keyof typeof copy.generator.hint.names;

// What an invalid form is missing, and the first field to fix: a missing one before one too long.
// The schema's issues come in form order, and only a required field can be too small.
export function validationHint(values: GenerateRequest): { hint: string; field?: FieldName } {
  const { hint } = copy.generator;
  const issues = generateRequestSchema.safeParse(values).error?.issues ?? [];
  const missing = issues
    .filter((issue) => issue.code === 'too_small')
    .map((issue) => issue.path[0] as NamedField);
  return {
    hint:
      missing.length > 0 ? hint.missing(missing.map((field) => hint.names[field])) : hint.tooLong,
    field: missing[0] ?? (issues[0]?.path[0] as FieldName | undefined),
  };
}
