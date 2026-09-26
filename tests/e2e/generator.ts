import type { Page } from '@playwright/test';

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

// The panel is the preview's single live region; the copy feedback region has no aria-busy.
export function previewPanel(page: Page) {
  return page.locator('[aria-live="polite"][aria-busy]');
}
