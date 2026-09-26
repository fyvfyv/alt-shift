import { mockProvider } from './mock.js';
import type { Provider } from './types.js';
import { variantProvider } from './variant.js';

export type ProviderName = 'variant' | 'mock';

export const providers: Record<ProviderName, Provider> = {
  variant: variantProvider,
  mock: mockProvider,
};

type ProviderEnv = {
  VERCEL_ENV?: string;
  GENERATION_PROVIDER?: string;
  GENERATION_API_TOKEN?: string;
};

// Deployments always hit the real API; a fresh clone without a token runs offline on the mock.
export function resolveProvider(env: ProviderEnv): ProviderName {
  if (env.VERCEL_ENV) return 'variant';
  const override = env.GENERATION_PROVIDER;
  if (override) {
    if (override === 'variant' || override === 'mock') return override;
    throw new Error(`GENERATION_PROVIDER must be "variant" or "mock", got "${override}".`);
  }
  return env.GENERATION_API_TOKEN ? 'variant' : 'mock';
}
