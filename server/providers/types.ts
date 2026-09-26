import type { GenerationInput } from '../prompt.js';

export type ProviderContext = {
  signal: AbortSignal;
  // The user's details; the mock replays a transcript of matching length.
  details: string;
  mockScenario?: string;
};

// Returns the upstream response as-is: an SSE body on success, a JSON error envelope otherwise.
export type Provider = (input: GenerationInput, ctx: ProviderContext) => Promise<Response>;
