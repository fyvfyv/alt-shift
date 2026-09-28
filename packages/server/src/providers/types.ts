import type { GenerateRequest } from '@alt-shift/shared/types';
import type { GenerationInput } from '../prompt.js';

export type ProviderContext = {
  signal: AbortSignal;
  request: GenerateRequest;
  headers: Headers;
};

export type Provider = (input: GenerationInput, ctx: ProviderContext) => Promise<Response>;

export type ProviderName = 'variant' | 'mock';

export type ProviderEnv = {
  VERCEL_ENV?: string;
  GENERATION_PROVIDER?: string;
  GENERATION_API_TOKEN?: string;
};
