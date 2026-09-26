/// <reference lib="dom" />
import type { Page } from '@playwright/test';
import type { Letter } from '../../src/features/letters/model';

export function lettersOf(count: number): Letter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `seed-${i}`,
    createdAt: Date.UTC(2026, 8, 1 + i),
    jobTitle: `Product Designer ${i + 1}`,
    company: 'Acme',
    text: `Dear Acme team,\n\nI am excited to apply for role ${i + 1}.\n\nBest regards`,
  }));
}

// Not addInitScript: that re-runs on every navigation and would overwrite whatever the test has
// since changed. Needs a page already open on the origin, so call it after the first goto.
export async function seedLetters(page: Page, letters: Letter[]): Promise<void> {
  await page.evaluate(
    (envelope) => window.localStorage.setItem('alt-shift.letters', envelope),
    JSON.stringify({ version: 1, letters }),
  );
  await page.reload();
}
