import { expect, type Page, test } from '@playwright/test';
import { lettersOf, seedLetters } from './helpers';

// The header too: a spill into the page gutter does not widen the page itself. Only a positive
// difference scrolls; a reserved scrollbar gutter (classic scrollbars, as on Linux) makes it negative.
async function expectNoSidewaysScroll(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const header = document.querySelector('header');
    return {
      page: Math.max(0, root.scrollWidth - root.clientWidth),
      header: header ? header.scrollWidth - header.clientWidth : Number.POSITIVE_INFINITY,
    };
  });
  expect(overflow).toEqual({ page: 0, header: 0 });
}

for (const count of [3, 5]) {
  test(`on a phone neither page scrolls sideways at ${count}/5`, {
    tag: '@phone',
  }, async ({ page }) => {
    await page.goto('/');
    await seedLetters(page, lettersOf(count));
    await expectNoSidewaysScroll(page);

    await page.goto('/new');
    await expectNoSidewaysScroll(page);
  });
}

test('on a phone the dots turn into an unsqueezed badge and the logo keeps its size', {
  tag: '@phone',
}, async ({ page }) => {
  await page.goto('/');
  const logo = page.getByRole('link', { name: 'Alt+Shift home' });
  await seedLetters(page, lettersOf(4));
  const withDots = (await logo.boundingBox())?.width;

  await seedLetters(page, lettersOf(5));

  const badge = page.getByRole('status', { name: '5 of 5 applications generated' }).locator('svg');
  const box = await badge.boundingBox();
  if (!box) throw new Error('the badge is not rendered');
  expect(box.width).toBe(box.height);
  expect((await logo.boundingBox())?.width).toBe(withDots);
});
