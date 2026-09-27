import { describe, expect, it } from 'vitest';
import { withSignature } from './model';

describe('withSignature', () => {
  it('puts the name under a closing sign-off', () => {
    expect(withSignature('Dear team,\n\nI would love to join.\n\nBest regards,\n', 'Oleg')).toBe(
      'Dear team,\n\nI would love to join.\n\nBest regards,\nOleg',
    );
  });

  it('leaves a letter that does not end on a sign-off unchanged', () => {
    const text = 'Dear team,\n\nI would love to join.';
    expect(withSignature(text, 'Oleg')).toBe(text);
  });
});
