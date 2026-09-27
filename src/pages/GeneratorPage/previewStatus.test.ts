import { describe, expect, it } from 'vitest';
import type { PreviewState } from '../../features/generation/generationReducer';
import { statusMessage } from './previewStatus';

describe('statusMessage', () => {
  it.each<[string, PreviewState]>([
    ['an error without a letter', { status: 'error', error: { kind: 'upstream' } }],
    ['a kept letter', { status: 'error', error: { kind: 'network' }, text: 'Dear' }],
  ])('leaves %s to its alert', (_, state) => {
    expect(statusMessage(state, true)).toBe('');
  });
});
