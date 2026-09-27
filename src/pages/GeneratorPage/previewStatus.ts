import { copy } from '../../copy';
import type { PreviewState } from '../../features/generation/generationReducer';

// What the page's one status line says about the preview: a run starting, finishing or being cut.
// Streaming says the same as loading, so the growing letter is never re-announced; an error that
// shows an alert says nothing here, so it is not read twice.
export function statusMessage(state: PreviewState): string {
  switch (state.status) {
    case 'empty':
      return '';
    case 'loading':
    case 'streaming':
      return copy.preview.status.generating;
    case 'completed':
      return copy.preview.status.ready;
    case 'error':
      return state.error.kind === 'stream-cut' ? copy.preview.streamCut : '';
  }
}
