import { copy } from '@copy';
import { failedBeforeText, keptLetter } from '@services/generation/selectors';
import type { PreviewState } from '@services/generation/types';
import type { KeptNoteKind, PreviewView } from './types';

export function cutNote(previousSaved: boolean, keptTitle?: string): string {
  return previousSaved
    ? `${copy.preview.streamCut} ${copy.preview.kept(keptTitle)}`
    : copy.preview.streamCut;
}

export function statusMessage(state: PreviewState, previousSaved: boolean): string {
  switch (state.status) {
    case 'empty':
      return '';
    case 'queued':
      return copy.preview.status.queued;
    case 'loading':
    case 'streaming':
      return copy.preview.status.generating;
    case 'completed':
      return copy.preview.status.ready;
    case 'error':
      return state.error.kind === 'stream-cut' ? cutNote(previousSaved) : '';
  }
}

// The orb holds the panel through its exit animation, so `showOrb` outlasts the loading state.
export function previewViewOf(
  state: PreviewState,
  saved: string | undefined,
  showOrb: boolean,
): PreviewView {
  if (showOrb) return 'loading';
  if (failedBeforeText(state, saved)) return 'failed';
  if (state.status === 'queued' && keptLetter(state, saved) === undefined) return 'queued';
  if (state.status === 'empty') return 'empty';
  return 'letter';
}

export function keptNoteKind(
  state: PreviewState,
  kept?: string,
  keptTitle?: string,
): KeptNoteKind | null {
  if (kept === undefined) return null;
  if (state.status === 'queued') return 'queued';
  if (state.status === 'error') return state.error.kind === 'stream-cut' ? 'cut' : 'failed';
  return keptTitle ? 'saved' : null;
}

// Text the run wrote so far, streaming or cut.
export function partialText(state: PreviewState): string | undefined {
  return state.status === 'streaming' || state.status === 'error' ? state.text : undefined;
}
