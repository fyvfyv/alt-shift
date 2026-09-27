import type { GenerationError } from './errors';

export type PreviewState =
  | { status: 'empty' }
  | { status: 'loading'; previous?: string }
  | { status: 'streaming'; text: string }
  | { status: 'completed'; text: string }
  // `text`: the cut partial letter, or for other errors the previous letter still shown.
  | { status: 'error'; error: GenerationError; text?: string };

export type GenerationEvent =
  | { type: 'start' }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: GenerationError }
  | { type: 'abort' };

export const initialPreviewState: PreviewState = { status: 'empty' };

export type RetryableError = Exclude<GenerationError, { kind: 'stream-cut' }>;

export function keptLetter(state: PreviewState, saved?: string): string | undefined {
  if (state.status === 'completed') return state.text;
  if (state.status !== 'error') return undefined;
  return (state.error.kind === 'stream-cut' ? undefined : state.text) ?? saved;
}

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
      if (state.status === 'loading')
        return { status: 'error', error: { kind: 'upstream' }, text: state.previous };
      return state;
    case 'error':
      if (state.status === 'streaming')
        return { status: 'error', error: event.error, text: state.text };
      if (state.status === 'loading')
        return { status: 'error', error: event.error, text: state.previous };
      return state;
  }
}
