import { describe, expect, it } from 'vitest';
import { resolveProvider } from '.';

describe('resolveProvider', () => {
  it('uses the real API when a token is set', () => {
    expect(resolveProvider({ GENERATION_API_TOKEN: 'token' })).toBe('variant');
  });

  it('falls back to the mock when nothing is configured', () => {
    expect(resolveProvider({})).toBe('mock');
  });

  it('always uses the real API on Vercel, whatever the override says', () => {
    expect(resolveProvider({ VERCEL_ENV: 'preview', GENERATION_PROVIDER: 'mock' })).toBe('variant');
  });

  it('throws on an unknown override', () => {
    expect(() => resolveProvider({ GENERATION_PROVIDER: 'gateway' })).toThrow(
      /GENERATION_PROVIDER/,
    );
  });
});
