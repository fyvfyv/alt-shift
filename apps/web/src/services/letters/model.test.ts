import { describe, expect, it } from 'vitest';
import { endsOnSignOff, looksWhole, withSignature } from './model';

const BODY = 'Dear team,\n\nI would love to join.\n\n';

describe('endsOnSignOff', () => {
  it.each(['Sincerely,', 'Warm regards,', 'Yours truly,', 'Best regards,\n\n', 'З повагою,'])(
    'accepts a letter whose last line is %j',
    (closing) => {
      expect(endsOnSignOff(`${BODY}${closing}`)).toBe(true);
    },
  );

  it.each([
    ['cut mid-sentence', 'Dear team,\n\nI build scalable and'],
    ['on a sign-off word inside a sentence', 'Dear team,\n\nBest regards to your founders'],
    ['on the greeting', 'Dear team,'],
    ['on nothing', ''],
  ])('rejects a letter that ends %s', (_, text) => {
    expect(endsOnSignOff(text)).toBe(false);
  });
});

describe('looksWhole', () => {
  it.each([
    'Sincerely,',
    'Sincerely,\nJane Doe',
    'Warmly,',
    'Respectfully,',
    'All the best,',
    'З повагою,\nОлена',
    'Thank you for your consideration.',
  ])('takes a letter ending %j as whole', (ending) => {
    expect(looksWhole(`${BODY}${ending}`)).toBe(true);
  });

  // Real live-API cut endings, plus a bare greeting.
  it.each([
    'Dear team,\n\nI excel in building fast, accessible user interfaces',
    `${BODY}I build scalable and`,
    `${BODY}At my last job I also contributed`,
    'Dear team,\n\nI build',
    'Dear team,',
  ])('takes %j as cut', (text) => {
    expect(looksWhole(text)).toBe(false);
  });
});

describe('withSignature', () => {
  it('puts the name under a closing sign-off', () => {
    expect(withSignature('Dear team,\n\nI would love to join.\n\nBest regards,\n', 'Oleg')).toBe(
      'Dear team,\n\nI would love to join.\n\nBest regards,\nOleg',
    );
  });

  it.each([
    ['does not end on a sign-off', 'Dear team,\n\nI would love to join.'],
    ['the model already signed', `${BODY}Sincerely,\nJane Doe`],
  ])('leaves a letter that %s unchanged', (_, text) => {
    expect(withSignature(text, 'Oleg')).toBe(text);
  });
});
