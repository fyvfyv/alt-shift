import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { lettersOf, seedLetters } from './seed';

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

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

test('generator, completed letter', async ({ page }) => {
  test.slow();
  await page.goto('/new');
  await page.getByLabel('Job title').fill('Product Designer');
  await page.getByLabel('Company').fill('Acme');
  await page.getByLabel('I am good at...').fill('Design systems, prototyping');
  await page.getByRole('button', { name: 'Generate Now' }).click();
  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible({
    timeout: 30_000,
  });

  await expectNoSeriousViolations(page);
});
