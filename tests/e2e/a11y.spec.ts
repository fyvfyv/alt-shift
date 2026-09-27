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

// Transitions off, so axe never samples the CTA mid-way through its primary-to-secondary swap.
test.use({ reducedMotion: 'reduce' });

async function expectNoSeriousViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test('dashboard, empty, with letters and reading one', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try an example' })).toBeVisible();
  await expectNoSeriousViolations(page);

  const filler = 'A sentence about impact. '.repeat(40).trim();
  await seedLetters(page, lettersOf(3, { text: `Dear Acme team,\n\n${filler}` }));
  await expect(page.getByRole('article')).toHaveCount(3);
  await expectNoSeriousViolations(page);

  await page
    .getByRole('article', { name: 'Role 0, Acme' })
    .getByRole('button', { name: 'Read more' })
    .click();
  await expect(page.getByRole('dialog', { name: 'Role 0, Acme' })).toBeVisible();
  await expectNoSeriousViolations(page);
});

test('generator, empty, loading and completed', async ({ page }) => {
  const release = await holdGeneration(page);
  await page.goto('/new');
  await expect(page.getByRole('heading', { level: 1, name: 'New application' })).toBeVisible();
  await expectNoSeriousViolations(page);

  await fillGeneratorForm(page);
  await page.getByRole('button', { name: 'Generate Now' }).click();
  await expect(previewPanel(page)).toContainText('Writing your letter for Acme…');
  await expectNoSeriousViolations(page);

  release();
  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();
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
