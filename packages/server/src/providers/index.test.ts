import { describe, expect, it } from 'vitest';
import { resolveProvider } from '.';

describe('resolveProvider', () => {
  it.each([
    [{ GENERATION_API_TOKEN: 'token' }, 'variant'],
    [{}, 'mock'],
    [{ VERCEL_ENV: 'preview', GENERATION_PROVIDER: 'mock' }, 'variant'],
  ] as const)('resolves %o to %s', (env, name) => {
    expect(resolveProvider(env)).toBe(name);
  });

  it('throws on an unknown override', () => {
    expect(() => resolveProvider({ GENERATION_PROVIDER: 'gateway' })).toThrow(
      /GENERATION_PROVIDER/,
    );
  });
});
