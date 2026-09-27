import { expect, test } from '@playwright/test';
import { fillGeneratorForm, holdGeneration, previewPanel, routeMockScenario } from './generator';

// 600+ characters select the mock's longest transcript, so streaming is slow enough to observe.
const LONG_DETAILS =
  'I rebuilt a design system used by six product teams and cut UI review time in half. '.repeat(8);

test('a generated letter streams in, is saved and survives a reload', async ({ page }) => {
  test.slow();
  const release = await holdGeneration(page);
  await page.goto('/new');
  await fillGeneratorForm(page, LONG_DETAILS);
  await page.getByRole('button', { name: 'Generate Now' }).click();

  const panel = previewPanel(page);
  await expect(page.getByRole('button', { name: 'Generating…' })).toBeDisabled();
  await expect(panel.locator('[aria-hidden]')).toBeVisible();
  // Two seconds in, the orb gets a caption naming the company.
  await expect(panel).toContainText('Generating');
  await expect(panel).toContainText('Writing your letter for Acme…');

  release();
  await expect(panel).not.toContainText('Writing your letter for Acme…');
  const textLength = async () => (await panel.innerText()).length;
  await expect.poll(textLength).toBeGreaterThan(0);
  const partial = await textLength();
  await expect(panel).toHaveAttribute('aria-busy', 'true');
  await expect.poll(textLength).toBeGreaterThan(partial);

  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('link', { name: 'Dashboard' }).click();
  const card = page.getByRole('article', { name: 'Product Designer, Acme' });
  const counter = page.getByRole('status', { name: '1 of 5 applications generated' });
  await expect(card).toBeVisible();
  await expect(counter).toBeVisible();

  // The long letter overflows the card's fixed height; Read more lets it grow.
  const collapsedHeight = (await card.boundingBox())?.height ?? 0;
  await card.getByRole('button', { name: 'Read more' }).click();
  await expect(card.getByRole('button', { name: 'Show less' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect((await card.boundingBox())?.height).toBeGreaterThan(collapsedHeight);

  await page.reload();
  await expect(card).toBeVisible();
  await expect(counter).toBeVisible();
});

test('a dropped stream keeps the partial letter and saves nothing', async ({ page }) => {
  test.slow();
  await routeMockScenario(page, 'disconnect');
  await page.goto('/new');
  await fillGeneratorForm(page);
  await page.getByRole('button', { name: 'Generate Now' }).click();

  const panel = previewPanel(page);
  await expect(page.getByText('The letter was cut short.')).toBeVisible({ timeout: 15_000 });
  // The mock replays recorded letters, so only the greeting is known.
  await expect(panel).toContainText('Dear ');
  // Try Again is offered twice: under the cut letter and as the form's CTA.
  await expect(panel.getByRole('button', { name: 'Try Again' })).toBeVisible();
  await expect(page.locator('form').getByRole('button', { name: 'Try Again' })).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByText('Your generated applications will appear here...')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('a rate-limited request counts down before it can be retried', async ({ page }) => {
  await routeMockScenario(page, 'rate-limit');
  await page.goto('/new');
  await fillGeneratorForm(page);
  const generate = page.getByRole('button', { name: 'Generate Now' });
  await generate.click();

  await expect(page.getByRole('alert')).toContainText('Too many requests');
  await expect(generate).toBeDisabled();
  await expect(page.getByRole('button', { name: /^Retry in \d+s$/ })).toBeDisabled();

  // The mock sends Retry-After: 3.
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeEnabled({
    timeout: 5_000,
  });
  await expect(generate).toBeEnabled();
});
