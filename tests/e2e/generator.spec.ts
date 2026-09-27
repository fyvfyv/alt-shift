import { expect, test } from '@playwright/test';
import { fillGeneratorForm, holdGeneration, previewPanel, routeMockScenario } from './helpers';

// 600+ characters make the mock replay its long transcript, slow enough to watch grow.
const LONG_DETAILS =
  'I rebuilt a design system used by six product teams and cut UI review time in half. '.repeat(8);

test('a generated letter streams in, is saved and survives a reload', { tag: '@desktop' }, async ({
  page,
}) => {
  const release = await holdGeneration(page);
  await page.goto('/new');
  await fillGeneratorForm(page, LONG_DETAILS);
  await page.getByRole('button', { name: 'Generate Now' }).click();

  const panel = previewPanel(page);
  await expect(page.getByRole('button', { name: 'Generating…' })).toBeDisabled();
  await expect(panel.locator('[aria-hidden]')).toBeVisible();
  await expect(panel).toContainText('Writing your letter for Acme…');

  release();
  await expect(panel).not.toContainText('Writing your letter for Acme…');
  const textLength = async () => (await panel.innerText()).length;
  await expect.poll(textLength).toBeGreaterThan(0);
  const partial = await textLength();
  await expect.poll(textLength).toBeGreaterThan(partial);

  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  const card = page.getByRole('article', { name: 'Product Designer, Acme' });
  const counter = page.getByRole('status', { name: '1 of 5 applications generated' });
  await expect(card).toBeVisible();
  await expect(counter).toBeVisible();

  await page.reload();
  await expect(card).toBeVisible();
  await expect(counter).toBeVisible();
});

test('on a phone Generate Now brings the preview under the form into view', {
  tag: '@phone',
}, async ({ page }) => {
  await holdGeneration(page);
  await page.goto('/new');
  await fillGeneratorForm(page);
  const panel = previewPanel(page);
  await expect(panel).not.toBeInViewport();

  await page.getByRole('button', { name: 'Generate Now' }).click();

  await expect(panel).toBeInViewport({ ratio: 0.5 });
});

test('a dropped stream keeps the partial letter and saves nothing', async ({ page }) => {
  await routeMockScenario(page, 'disconnect');
  await page.goto('/new');
  await fillGeneratorForm(page);
  await page.getByRole('button', { name: 'Generate Now' }).click();

  const panel = previewPanel(page);
  await expect(panel.getByText('The letter was cut short.')).toBeVisible();
  await expect(panel).toContainText('Dear ');
  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Try Again' })).toBeVisible();
  await expect(page.locator('form').getByRole('button', { name: 'Try Again' })).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText('Your generated applications will appear here...')).toBeVisible();
});
