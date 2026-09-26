import { describe, expect, it } from 'vitest';
import { countChars, LIMITS, validateGenerateRequest } from './generation';

const valid = {
  jobTitle: 'Product Designer',
  company: 'Acme',
  skills: 'Figma, prototyping',
  details: 'I led the redesign of a checkout flow.',
};

describe('countChars', () => {
  it('counts an astral emoji as one character', () => {
    expect(countChars('ab😀')).toBe(3);
  });
});

describe('validateGenerateRequest', () => {
  it('returns trimmed values for valid input', () => {
    const result = validateGenerateRequest({
      jobTitle: '  Product Designer ',
      company: '\tAcme\n',
      skills: ' Figma ',
      details: '  Line one\n\nLine two  ',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        jobTitle: 'Product Designer',
        company: 'Acme',
        skills: 'Figma',
        details: 'Line one\n\nLine two',
      },
    });
  });

  const { company: _omitted, ...missingCompany } = valid;

  it.each([
    ['missing', missingCompany],
    ['whitespace-only', { ...valid, company: '   ' }],
  ])('rejects a %s required field', (_case, body) => {
    expect(validateGenerateRequest(body)).toEqual({ ok: false, message: 'company is required.' });
  });

  it('accepts empty or missing details', () => {
    expect(validateGenerateRequest({ ...valid, details: '' })).toMatchObject({ ok: true });

    const { details: _omitted, ...withoutDetails } = valid;
    expect(validateGenerateRequest(withoutDetails)).toEqual({
      ok: true,
      value: { ...withoutDetails, details: '' },
    });
  });

  it('counts code points for the details limit', () => {
    const atLimit = `${'a'.repeat(LIMITS.details - 1)}😀`;

    expect(validateGenerateRequest({ ...valid, details: atLimit })).toMatchObject({ ok: true });
    expect(validateGenerateRequest({ ...valid, details: `${atLimit}a` })).toMatchObject({
      ok: false,
    });
  });

  it('rejects a single-line field over its limit', () => {
    const jobTitle = 'a'.repeat(LIMITS.singleLine + 1);

    expect(validateGenerateRequest({ ...valid, jobTitle })).toMatchObject({ ok: false });
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'hello'],
  ])('rejects %s as the body', (_label, input) => {
    expect(validateGenerateRequest(input)).toMatchObject({ ok: false });
  });

  it('rejects a non-string field value', () => {
    expect(validateGenerateRequest({ ...valid, jobTitle: 42 })).toMatchObject({ ok: false });
    expect(validateGenerateRequest({ ...valid, details: ['a'] })).toMatchObject({ ok: false });
  });
});
