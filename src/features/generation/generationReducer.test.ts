import { describe, expect, it } from 'vitest';
import {
  type GenerationEvent,
  generationReducer,
  initialPreviewState,
  type PreviewState,
} from './generationReducer';

function run(events: GenerationEvent[], from: PreviewState = initialPreviewState): PreviewState {
  return events.reduce(generationReducer, from);
}

describe('generationReducer', () => {
  it('goes empty → loading → streaming → completed, accumulating text', () => {
    const loading = run([{ type: 'start' }]);
    const streaming = run([{ type: 'delta', text: 'Dear ' }], loading);
    const completed = run([{ type: 'delta', text: 'Apple' }, { type: 'done' }], streaming);

    expect(loading).toEqual({ status: 'loading' });
    expect(streaming).toEqual({ status: 'streaming', text: 'Dear ' });
    expect(completed).toEqual({ status: 'completed', text: 'Dear Apple' });
  });

  it('treats done without any text as an upstream failure', () => {
    expect(run([{ type: 'start' }, { type: 'done' }])).toEqual({
      status: 'error',
      error: { kind: 'upstream' },
    });
  });

  it('keeps the received text when an error arrives mid-stream', () => {
    const state = run([
      { type: 'start' },
      { type: 'delta', text: 'Dear' },
      { type: 'error', error: { kind: 'stream-cut' } },
    ]);

    expect(state).toEqual({ status: 'error', error: { kind: 'stream-cut' }, text: 'Dear' });
  });

  it('reports an error before the first delta without text', () => {
    const error = { kind: 'rate-limit', retryAfterSeconds: 3 } as const;

    expect(run([{ type: 'start' }, { type: 'error', error }])).toEqual({ status: 'error', error });
  });

  it('returns to empty on abort', () => {
    expect(run([{ type: 'start' }, { type: 'delta', text: 'Dear' }, { type: 'abort' }])).toEqual(
      initialPreviewState,
    );
  });

  it('starts over from a finished run', () => {
    const completed = run([{ type: 'start' }, { type: 'delta', text: 'Dear' }, { type: 'done' }]);

    expect(run([{ type: 'start' }], completed)).toEqual({ status: 'loading' });
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
