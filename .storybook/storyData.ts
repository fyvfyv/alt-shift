import type { GenerationPort } from '../src/features/generation/generationClient';
import type { Letter } from '../src/features/letters/model';
import { recorded } from '../src/test/fixtures';

// Real letters recorded from the Variant API, so stories show true lengths and paragraphing.
export const sampleText = recorded('medium').text;

export function sampleLetters(count: number): Letter[] {
  const texts = [recorded('short').text, recorded('medium').text, recorded('long').text];
  return Array.from({ length: count }, (_, i) => ({
    id: `story-${i}`,
    createdAt: Date.UTC(2026, 8, 1 + i),
    jobTitle: 'Product Manager',
    company: 'Apple',
    text: texts[i % texts.length] ?? '',
  }));
}

// Honours abort like the real client, so cancel paths behave in stories.
export function createStoryPort(delayMs: number): GenerationPort {
  return async function* (_request, signal) {
    for (const word of sampleText.split(/(?<=\s)/)) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      signal.throwIfAborted();
      yield word;
    }
  };
}
