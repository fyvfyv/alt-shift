import { expect, type Locator, test } from '@playwright/test';
import { lettersOf, previewPanel, seedLetters } from './helpers';

async function rightEdge(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return box.x + box.width;
}

test('Read more opens a clipped letter whole over the page and moves no card', async ({ page }) => {
  await page.goto('/');
  const filler = 'A sentence about impact. '.repeat(40).trim();
  await seedLetters(
    page,
    lettersOf(2).map((l) => ({ ...l, text: `${l.text}\n\n${filler}` })),
  );

  // The second card: the right-hand one wherever the grid has two columns.
  const card = page.getByRole('article').nth(1);
  const readMore = card.getByRole('button', { name: 'Read more' });
  await expect(readMore).toBeVisible();

  // 24px is the card padding: an action past it is clipped by the card, not scrolled to.
  const contentEdge = (await rightEdge(card)) - 24;
  for (const name of ['Delete', 'Read more', 'Copy to clipboard']) {
    expect(await rightEdge(card.getByRole('button', { name }))).toBeLessThanOrEqual(contentEdge);
  }

  const before = await card.boundingBox();
  await readMore.click();
  const reader = page.getByRole('dialog');
  await expect(reader).toContainText(filler);
  await expect(reader.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();
  expect(await card.boundingBox()).toEqual(before);
  const viewport = page.viewportSize();
  expect(await rightEdge(reader)).toBeLessThanOrEqual(viewport?.width ?? 0);

  await page.keyboard.press('Escape');
  await expect(reader).toHaveCount(0);
  await expect(readMore).toBeFocused();

  // A click inside the reader keeps it open; one on the backdrop closes it.
  await readMore.click();
  await reader.getByRole('heading').click();
  await expect(reader).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(reader).toHaveCount(0);
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
  await expect(panel).toContainText('HTML and CSS');

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('article', { name: 'Product manager, Apple' })).toBeVisible();
});
