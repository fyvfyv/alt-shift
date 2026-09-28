import type { Letter } from '../services/letters/types';

// Playwright imports this too (tests/e2e/helpers.ts), so keep Vitest and the DOM out of it.
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
