import { copy } from '@copy';
import type { PreviewState, RetryableError, Run } from '@services/generation/types';
import type { RunView } from './types';

export function runTitle({ request }: Run): string {
  return copy.letter.title(request.jobTitle, request.company);
}

export function runViewOf(state: PreviewState): RunView {
  if (state.status === 'queued') return 'queued';
  if (state.status === 'loading') return 'starting';
  if (state.status === 'streaming') return 'streaming';
  if (state.status !== 'error') return 'none';
  return state.error.kind === 'stream-cut' ? 'cut' : 'failed';
}

// Waiting for its first text, or streaming it.
export function isWriting(state: PreviewState): boolean {
  return state.status === 'loading' || state.status === 'streaming';
}

export function hasChip(state: PreviewState): boolean {
  return state.status === 'queued' || isWriting(state);
}

export function chipLabel(state: PreviewState, stalled: boolean): string {
  if (state.status === 'queued') return copy.queue.label;
  return stalled ? copy.preview.streaming.stalled : copy.preview.streaming.writing;
}

// The text while it streams; undefined once it stops, which ends following and timing it.
export function streamedText(state: PreviewState): string | undefined {
  return state.status === 'streaming' ? state.text : undefined;
}

// Text the run wrote so far, streaming or cut.
export function partialText(state: PreviewState): string {
  if (state.status === 'streaming') return state.text;
  return state.status === 'error' ? (state.text ?? '') : '';
}

export function failureOf(state: PreviewState): RetryableError | null {
  return state.status === 'error' && state.error.kind !== 'stream-cut' ? state.error : null;
}

export function retryAtOf(state: PreviewState): number | undefined {
  return state.status === 'error' && state.error.kind === 'rate-limit'
    ? state.error.retryAt
    : undefined;
}
