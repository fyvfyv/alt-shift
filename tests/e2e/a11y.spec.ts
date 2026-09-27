import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import {
  fillGeneratorForm,
  holdGeneration,
  lettersOf,
  previewPanel,
  routeMockScenario,
  seedLetters,
} from './helpers';

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test('dashboard, empty', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try an example' })).toBeVisible();

  await expectNoSeriousViolations(page);
});

test('dashboard with letters', async ({ page }) => {
  await page.goto('/');
  await seedLetters(page, lettersOf(3));
  await expect(page.getByRole('article')).toHaveCount(3);

  await expectNoSeriousViolations(page);
});

test('generator, empty', async ({ page }) => {
  await page.goto('/new');
  await expect(page.getByRole('heading', { level: 1, name: 'New application' })).toBeVisible();

  await expectNoSeriousViolations(page);
});

test('generator, loading', async ({ page }) => {
  await holdGeneration(page);
  await page.goto('/new');
  await fillGeneratorForm(page);
  await page.getByRole('button', { name: 'Generate Now' }).click();
  // The caption shows two seconds in; its text sits on the panel's tinted surface.
  await expect(previewPanel(page)).toContainText('Writing your letter for Acme…');

  await expectNoSeriousViolations(page);
});

test('generator, rate-limited', async ({ page }) => {
  await routeMockScenario(page, 'rate-limit');
  await page.goto('/new');
  await fillGeneratorForm(page);
  await page.getByRole('button', { name: 'Generate Now' }).click();
  await expect(page.getByRole('alert')).toContainText('Too many requests');

  await expectNoSeriousViolations(page);
});

test('generator, completed letter', async ({ page }) => {
  await page.goto('/new');
  await fillGeneratorForm(page);
  await page.getByRole('button', { name: 'Generate Now' }).click();
  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();

  await expectNoSeriousViolations(page);
});
