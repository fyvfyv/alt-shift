import { copy } from '../../copy';
import type { PreviewState } from '../../features/generation/generationReducer';

export function cutNote(previousSaved: boolean, keptTitle?: string): string {
  return previousSaved
    ? `${copy.preview.streamCut} ${copy.preview.kept(keptTitle)}`
    : copy.preview.streamCut;
}

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
