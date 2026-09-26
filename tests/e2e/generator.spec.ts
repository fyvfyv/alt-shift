import { expect, test } from '@playwright/test';
import { fillGeneratorForm, previewPanel, routeMockScenario } from './generator';

// 600+ characters select the mock's longest transcript, so streaming is slow enough to observe.
const LONG_DETAILS =
  'I rebuilt a design system used by six product teams and cut UI review time in half. '.repeat(8);

// Shorter than the mock's MOCK_FIRST_DELTA_MS (1200), so these checks land before the first token.
const BEFORE_FIRST_TOKEN = { timeout: 1_000 };

test('a generated letter streams in, is saved and survives a reload', async ({ page }) => {
  test.slow();
  await page.goto('/new');
  await fillGeneratorForm(page, LONG_DETAILS);
  await page.getByRole('button', { name: 'Generate Now' }).click();

  const panel = previewPanel(page);
  await expect(page.getByRole('button', { name: 'Generating…' })).toBeDisabled(BEFORE_FIRST_TOKEN);
  await expect(panel.locator('[aria-hidden]')).toBeVisible(BEFORE_FIRST_TOKEN);

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

  await expect(page.getByText('The letter was cut short.')).toBeVisible({ timeout: 15_000 });
  // The mock replays recorded letters, so only the greeting is known.
  await expect(previewPanel(page)).toContainText('Dear ');
  await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();

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
