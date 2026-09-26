import { expect, test } from '@playwright/test';
import { lettersOf, seedLetters } from './seed';

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

test('an empty dashboard invites the first letter', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Your generated applications will appear here...')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Hit your goal' })).toContainText('0 out of 5');
});
