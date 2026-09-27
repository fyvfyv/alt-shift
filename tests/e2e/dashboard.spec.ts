import { expect, type Locator, test } from '@playwright/test';
import { lettersOf, seedLetters } from './helpers';

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

  const card = page.getByRole('article').nth(1);
  const readMore = card.getByRole('button', { name: 'Read more' });
  await expect(readMore).toBeVisible();

  // 24px is the card padding; the card clips an action past it.
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

  await readMore.click();
  await reader.getByRole('heading').click();
  await expect(reader).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(reader).toHaveCount(0);
});
