import type { Letter } from '../features/letters/model';

// Fixed ids and dates keep the order stable: letter 0 is the oldest, so pages list it last.
// The browser tests seed these too, so this file imports nothing from Vitest or the DOM.
export function lettersOf(count: number, overrides: Partial<Letter> = {}): Letter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `letter-${i}`,
    createdAt: Date.UTC(2026, 8, 1 + i),
    jobTitle: `Role ${i}`,
    company: 'Acme',
    text: `Dear Acme team,\n\nLetter ${i} body.`,
    ...overrides,
  }));
}
