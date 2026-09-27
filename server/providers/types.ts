import type { GenerateRequest } from '../../shared/generation.js';
import type { GenerationInput } from '../prompt.js';

export type ProviderContext = {
  signal: AbortSignal;
  // The validated request and the incoming headers: the mock templates its transcript from the
  // former and picks its failure scenario from the latter; the real provider uses neither.
  request: GenerateRequest;
  headers: Headers;
};

// Returns the upstream response as-is: an SSE body on success, a JSON error envelope otherwise.
export type Provider = (input: GenerationInput, ctx: ProviderContext) => Promise<Response>;
