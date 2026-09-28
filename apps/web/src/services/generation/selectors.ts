import type { PreviewState, RetryableError } from './types';

// Asked for and not finished: queued, waiting for its first text, or streaming.
export function isPending(state: PreviewState): boolean {
  return state.status === 'queued' || state.status === 'loading' || state.status === 'streaming';
}

// The whole letter to show: the finished one, or the one a new run keeps on screen until it has
// text. A cut letter is never kept; `saved` is the stored letter under the same id.
export function keptLetter(state: PreviewState, saved?: string): string | undefined {
  switch (state.status) {
    case 'completed':
      return state.text;
    case 'queued':
      return state.previous ?? saved;
    case 'error':
      return (state.error.kind === 'stream-cut' ? undefined : state.text) ?? saved;
    default:
      return undefined;
  }
}

// A failure with no letter to fall back on: the preview shows it in place of a letter.
export function failedBeforeText(state: PreviewState, saved?: string): RetryableError | null {
  if (state.status !== 'error' || state.error.kind === 'stream-cut') return null;
  return keptLetter(state, saved) === undefined ? state.error : null;
}
