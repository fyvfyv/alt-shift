import { expect, type Page, test } from '@playwright/test';
import { lettersOf, seedLetters } from './helpers';

// The header is the widest row on a phone: the logo, the counter with its dots or badge, and the
// Home button. The header check also catches a spill into the page gutter, which the page's own
// width does not show.
async function expectNoSidewaysScroll(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const header = document.querySelector('header');
    return {
      page: root.scrollWidth - root.clientWidth,
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

test('on a phone the goal badge is not squeezed', { tag: '@phone' }, async ({ page }) => {
  await page.goto('/');
  await seedLetters(page, lettersOf(5));

  const badge = page.getByRole('status', { name: '5 of 5 applications generated' }).locator('svg');
  const box = await badge.boundingBox();
  if (!box) throw new Error('the badge is not rendered');
  expect(box.width).toBe(box.height);
});

test('on a phone the logo keeps its size when the dots turn into the badge', {
  tag: '@phone',
}, async ({ page }) => {
  await page.goto('/');
  const logo = page.getByRole('link', { name: 'Alt+Shift home' });
  await seedLetters(page, lettersOf(4));
  const withDots = (await logo.boundingBox())?.width;

  await seedLetters(page, lettersOf(5));

  expect((await logo.boundingBox())?.width).toBe(withDots);
});
