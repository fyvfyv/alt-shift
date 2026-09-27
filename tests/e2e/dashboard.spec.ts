import { expect, type Locator, test } from '@playwright/test';
import { lettersOf, previewPanel, seedLetters } from './helpers';

async function rightEdge(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return box.x + box.width;
}

test('a clipped letter keeps every card action inside the card and grows on Read more', async ({
  page,
}) => {
  await page.goto('/');
  const filler = 'A sentence about impact. '.repeat(40);
  await seedLetters(
    page,
    lettersOf(1).map((l) => ({ ...l, text: `${l.text}\n\n${filler}` })),
  );

  const card = page.getByRole('article');
  await expect(card.getByRole('button', { name: 'Read more' })).toBeVisible();

  // 24px is the card padding: an action past it is clipped by the card, not scrolled to.
  const contentEdge = (await rightEdge(card)) - 24;
  for (const name of ['Delete', 'Read more', 'Copy to clipboard']) {
    expect(await rightEdge(card.getByRole('button', { name }))).toBeLessThanOrEqual(contentEdge);
  }

  const collapsedHeight = (await card.boundingBox())?.height ?? 0;
  await card.getByRole('button', { name: 'Read more' }).click();
  await expect(card.getByRole('button', { name: 'Show less' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect
    .poll(async () => (await card.boundingBox())?.height)
    .toBeGreaterThan(collapsedHeight);
});

test('reaching the goal swaps the dots for a badge and hides the banner', async ({ page }) => {
  await page.goto('/');
  await seedLetters(page, lettersOf(5));

  const counter = page.getByRole('status', { name: '5 of 5 applications generated' });
  await expect(counter).toBeVisible();
  await expect(counter.locator('svg')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Hit your goal' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Create New' }).click();
  await expect(page).toHaveURL('/new');
  await expect(page.getByRole('heading', { level: 1, name: 'New application' })).toBeVisible();
});

// The hand-over of the example into the form is covered in App.test.tsx; this is the browser
// half: the mock writes the example's company and job title into its recorded letter.
test('Try an example ends with a saved letter written for the example job', {
  tag: '@desktop',
}, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try an example' }).click();

  await expect(page).toHaveURL('/new');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Product manager, Apple' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Generate Now' }).click();

  const panel = previewPanel(page);
  await expect(panel).toContainText('Dear Apple team,');
  await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();
  await expect(panel).toContainText('Product manager');
  await expect(panel).not.toContainText('Northwind');

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('article', { name: 'Product manager, Apple' })).toBeVisible();
});
