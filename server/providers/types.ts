import type { GenerateRequest } from '../../shared/generation.js';
import type { GenerationInput } from '../prompt.js';

export type ProviderContext = {
  signal: AbortSignal;
  request: GenerateRequest;
  headers: Headers;
};

export type Provider = (input: GenerationInput, ctx: ProviderContext) => Promise<Response>;
