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

  it.each(['jobTitle', 'company', 'skills'] as const)('rejects a missing %s', (field) => {
    const { [field]: _omitted, ...rest } = valid;

    expect(validateGenerateRequest(rest)).toMatchObject({
      ok: false,
      code: 'invalid_request',
      field,
    });
  });

  it('rejects a whitespace-only required field', () => {
    expect(validateGenerateRequest({ ...valid, company: '   ' })).toMatchObject({
      ok: false,
      code: 'invalid_request',
      field: 'company',
    });
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
      code: 'invalid_request',
      field: 'details',
    });
  });

  it('rejects a single-line field over its limit', () => {
    const jobTitle = 'a'.repeat(LIMITS.singleLine + 1);

    expect(validateGenerateRequest({ ...valid, jobTitle })).toMatchObject({
      ok: false,
      code: 'invalid_request',
      field: 'jobTitle',
    });
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'hello'],
  ])('rejects %s without a field', (_label, input) => {
    const result = validateGenerateRequest(input);

    expect(result).toMatchObject({ ok: false, code: 'invalid_request' });
    expect(result).not.toHaveProperty('field');
  });

  it('rejects a non-string field value', () => {
    expect(validateGenerateRequest({ ...valid, jobTitle: 42 })).toMatchObject({
      ok: false,
      code: 'invalid_request',
      field: 'jobTitle',
    });
  });
});
