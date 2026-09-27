import type { GenerationError } from './errors';

export type PreviewState =
  | { status: 'empty' }
  | { status: 'loading'; previous?: string }
  | { status: 'streaming'; text: string }
  | { status: 'completed'; text: string }
  // `text` is the letter on screen: the partial one for a stream-cut, or the previous complete
  // letter when a regenerate failed before any text arrived.
  | { status: 'error'; error: GenerationError; text?: string };

export type GenerationEvent =
  | { type: 'start' }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: GenerationError }
  | { type: 'abort' };

export const initialPreviewState: PreviewState = { status: 'empty' };

// A complete letter stays on screen through a regenerate that fails before it starts.
function keptText(state: PreviewState): string | undefined {
  if (state.status === 'completed') return state.text;
  if (state.status === 'error' && state.error.kind !== 'stream-cut') return state.text;
  return undefined;
}

export function generationReducer(state: PreviewState, event: GenerationEvent): PreviewState {
  switch (event.type) {
    case 'start':
      return { status: 'loading', previous: keptText(state) };
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
