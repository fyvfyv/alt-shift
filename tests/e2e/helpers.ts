/// <reference lib="dom" />
import type { Page } from '@playwright/test';
import type { Letter } from '../../src/features/letters/model';

export { lettersOf } from '../../src/test/letters';

export async function fillGeneratorForm(page: Page, details = ''): Promise<void> {
  await page.getByLabel('Job title').fill('Product Designer');
  await page.getByLabel('Company').fill('Acme');
  await page.getByLabel('I am good at...').fill('Design systems, prototyping');
  await page.getByLabel('Additional details').fill(details);
}

// The mock provider picks its fault from this header; the app never sends it itself.
export async function routeMockScenario(
  page: Page,
  scenario: 'disconnect' | 'rate-limit',
): Promise<void> {
  await page.route('**/api/generate', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-mock-scenario': scenario } }),
  );
}

// Holds the request until the returned function is called, so the page stays in its loading
// state for as long as a check needs instead of racing the mock's first delta.
export async function holdGeneration(page: Page): Promise<() => void> {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/generate', async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

export function previewPanel(page: Page) {
  return page.getByRole('region', { name: 'Your letter' });
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
