import { copy } from '../../copy';
import type { PreviewState } from '../../features/generation/generationReducer';

// The note about a cut run. A cut regenerate leaves the saved letter it was replacing on screen,
// so the note says whose letter that is.
export function cutNote(previousSaved: boolean, keptTitle?: string): string {
  return previousSaved
    ? `${copy.preview.streamCut} ${copy.preview.kept(keptTitle)}`
    : copy.preview.streamCut;
}

// What the page's one status line says about the preview: a run starting, finishing or being cut.
// Streaming says the same as loading, so the growing letter is never re-announced; an error that
// shows an alert says nothing here, so it is not read twice.
export function statusMessage(state: PreviewState, previousSaved: boolean): string {
  switch (state.status) {
    case 'empty':
      return '';
    case 'loading':
    case 'streaming':
      return copy.preview.status.generating;
    case 'completed':
      return copy.preview.status.ready;
    case 'error':
      return state.error.kind === 'stream-cut' ? cutNote(previousSaved) : '';
  }
}
