import type { GenerationError } from './errors';

export type PreviewState =
  | { status: 'empty' }
  | { status: 'loading'; previous?: string }
  | { status: 'streaming'; text: string }
  | { status: 'completed'; text: string }
  // `text` is the letter on screen: the partial one for a stream-cut, or the previous complete
  // letter when a regenerate failed before any text arrived; keptLetter() tells the two apart.
  | { status: 'error'; error: GenerationError; text?: string };

export type GenerationEvent =
  | { type: 'start' }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: GenerationError }
  | { type: 'abort' };

export const initialPreviewState: PreviewState = { status: 'empty' };

// The failures that come before any text, so the run can simply be started again.
export type RetryableError = Exclude<GenerationError, { kind: 'stream-cut' }>;

// The complete letter on screen: the one just finished, or the previous one kept through a
// regenerate that failed before any text. A cut letter is never kept. `saved` is the stored letter
// a failed or cut run was regenerating: a cut drops it from the state, but it is still the user's.
export function keptLetter(state: PreviewState, saved?: string): string | undefined {
  if (state.status === 'completed') return state.text;
  if (state.status !== 'error') return undefined;
  return (state.error.kind === 'stream-cut' ? undefined : state.text) ?? saved;
}

// A failure with no letter to show: the panel holds only the error and its Retry.
export function failedBeforeText(state: PreviewState, saved?: string): RetryableError | null {
  if (state.status !== 'error' || state.error.kind === 'stream-cut') return null;
  return keptLetter(state, saved) === undefined ? state.error : null;
}

export function generationReducer(state: PreviewState, event: GenerationEvent): PreviewState {
  switch (event.type) {
    case 'start':
      return { status: 'loading', previous: keptLetter(state) };
    case 'abort':
      return initialPreviewState;
    case 'delta':
      if (state.status === 'loading') return { status: 'streaming', text: event.text };
      if (state.status === 'streaming')
        return { status: 'streaming', text: state.text + event.text };
      return state;
    case 'done':
      if (state.status === 'streaming') return { status: 'completed', text: state.text };
      // A stream that ends before any text produced nothing to show.
      if (state.status === 'loading')
        return { status: 'error', error: { kind: 'upstream' }, text: state.previous };
      return state;
    case 'error':
      // The thrown error carries no text; what was already shown stays on screen.
      if (state.status === 'streaming')
        return { status: 'error', error: event.error, text: state.text };
      if (state.status === 'loading')
        return { status: 'error', error: event.error, text: state.previous };
      return state;
  }
}
