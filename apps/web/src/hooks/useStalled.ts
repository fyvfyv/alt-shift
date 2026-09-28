import { useElapsed } from './useElapsed';

// The live API pauses mid-letter now and then; after this long without text, say so.
const STALLED_AFTER = 3;

// `text`: the letter so far while it streams, undefined otherwise.
export function useStalled(text: string | undefined): boolean {
  return useElapsed(text) >= STALLED_AFTER;
}
