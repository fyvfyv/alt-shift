import { describe, expect, it } from 'vitest';
import { generationReducer, initialPreviewState } from './generationReducer';
import type { GenerationEvent, PreviewState } from './types';

function run(events: GenerationEvent[], from: PreviewState = initialPreviewState): PreviewState {
  return events.reduce(generationReducer, from);
}

describe('generationReducer', () => {
  it('fails an empty stream as upstream, keeping a complete letter through the regenerate', () => {
    const emptyRun: GenerationEvent[] = [{ type: 'start' }, { type: 'done' }];
    const failed: PreviewState = { status: 'error', error: { kind: 'upstream' } };

    expect(run(emptyRun)).toEqual(failed);
    const kept = run(emptyRun, { status: 'completed', text: 'Dear' });
    expect(kept).toEqual({ ...failed, text: 'Dear' });
    expect(run(emptyRun, kept)).toEqual(kept);
  });

  it.each<[string, PreviewState]>([
    ['empty', initialPreviewState],
    ['completed', { status: 'completed', text: 'Dear' }],
    ['error', { status: 'error', error: { kind: 'upstream' } }],
  ])('ignores stream events once %s', (_, state) => {
    const events: GenerationEvent[] = [
      { type: 'delta', text: 'late' },
      { type: 'done' },
      { type: 'error', error: { kind: 'network' } },
    ];

    for (const event of events) expect(generationReducer(state, event)).toBe(state);
  });
});
