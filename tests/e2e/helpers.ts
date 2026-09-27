import type { Page } from '@playwright/test';
import type { Letter } from '../../src/features/letters/model';

export { lettersOf } from '../../src/test/letters';

export async function fillGeneratorForm(page: Page, details = ''): Promise<void> {
  await page.getByLabel('Job title').fill('Product Designer');
  await page.getByLabel('Company').fill('Acme');
  await page.getByLabel('I am good at...').fill('Design systems, prototyping');
  await page.getByLabel('Additional details').fill(details);
}

export async function routeMockScenario(
  page: Page,
  scenario: 'disconnect' | 'truncate' | 'rate-limit',
): Promise<void> {
  await page.route('**/api/generate', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-mock-scenario': scenario } }),
  );
}

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

// Not addInitScript: it re-runs on every navigation. Call after the first goto (needs the origin).
export async function seedLetters(page: Page, letters: Letter[]): Promise<void> {
  await page.evaluate(
    (envelope) => window.localStorage.setItem('alt-shift.letters', envelope),
    JSON.stringify({ version: 1, letters }),
  );
  await page.reload();
}
