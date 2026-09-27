import { describe, expect, it } from 'vitest';
import type { GenerationError } from './errors';
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

  it.each<[string, GenerationEvent, GenerationError]>([
    [
      'a rate limit',
      { type: 'error', error: { kind: 'rate-limit', retryAfterSeconds: 3 } },
      { kind: 'rate-limit', retryAfterSeconds: 3 },
    ],
    ['an empty stream', { type: 'done' }, { kind: 'upstream' }],
  ])('keeps the complete letter through a regenerate that fails with %s', (_, event, error) => {
    const kept = run([{ type: 'start' }, event], { status: 'completed', text: 'Dear' });

    expect(kept).toEqual({ status: 'error', error, text: 'Dear' });
    expect(run([{ type: 'start' }, event], kept)).toEqual(kept);
  });

  it('does not bring a cut letter back when the next run fails before any text', () => {
    const cut: PreviewState = { status: 'error', error: { kind: 'stream-cut' }, text: 'Dear' };
    const error = { kind: 'network' } as const;

    expect(run([{ type: 'start' }, { type: 'error', error }], cut)).toEqual({
      status: 'error',
      error,
    });
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
