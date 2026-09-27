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

// The panel is the preview's single live region; the copy feedback region has no aria-busy.
export function previewPanel(page: Page) {
  return page.locator('[aria-live="polite"][aria-busy]');
}
