import type { GenerationError } from './errors';

export type PreviewState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'streaming'; text: string }
  | { status: 'completed'; text: string }
  | { status: 'error'; error: GenerationError; text?: string };

export type GenerationEvent =
  | { type: 'start' }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; error: GenerationError }
  | { type: 'abort' };

export const initialPreviewState: PreviewState = { status: 'empty' };

export function generationReducer(state: PreviewState, event: GenerationEvent): PreviewState {
  switch (event.type) {
    case 'start':
      return { status: 'loading' };
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
      if (state.status === 'loading') return { status: 'error', error: { kind: 'upstream' } };
      return state;
    case 'error':
      // The thrown error carries no text; what was already shown stays on screen.
      if (state.status === 'streaming')
        return { status: 'error', error: event.error, text: state.text };
      if (state.status === 'loading') return { status: 'error', error: event.error };
      return state;
  }
}
