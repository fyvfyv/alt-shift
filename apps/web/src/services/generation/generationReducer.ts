import { createReducer } from '@utils/reducer';
import { keptLetter } from './selectors';
import type { GenerationError, GenerationEvents, PreviewState } from './types';

export const initialPreviewState: PreviewState = { status: 'empty' };

const failed = (error: GenerationError, text?: string): PreviewState => ({
  status: 'error',
  error,
  text,
});

// Each event moves only the states it applies to; any other state ignores it.
export const generationReducer = createReducer<PreviewState, GenerationEvents>({
  start: (state) => ({
    status: 'loading',
    previous: state.status === 'queued' ? state.previous : keptLetter(state),
  }),

  delta: (state, { text }) => {
    if (state.status === 'loading') return { status: 'streaming', text };
    if (state.status === 'streaming') return { status: 'streaming', text: state.text + text };
    return state;
  },

  done: (state) => {
    if (state.status === 'streaming') return { status: 'completed', text: state.text };
    if (state.status === 'loading') return failed({ kind: 'upstream' }, state.previous);
    return state;
  },

  error: (state, { error }) => {
    if (state.status === 'streaming') return failed(error, state.text);
    if (state.status === 'loading') return failed(error, state.previous);
    return state;
  },
});
