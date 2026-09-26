import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InMemoryLetterRepository } from '../../features/letters/inMemoryRepository';
import type { Letter } from '../../features/letters/model';
import { StorageError } from '../../features/letters/repository';
import { renderWithProviders } from '../../test/renderWithProviders';
import { DashboardPage } from './DashboardPage';

// Letter 0 is the oldest, so the page lists them in reverse.
function lettersOf(count: number): Letter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `letter-${i}`,
    createdAt: 1_000 + i,
    jobTitle: `Role ${i}`,
    company: 'Acme',
    text: `Dear Acme team,\n\nLetter ${i} body.`,
  }));
}

async function renderPage(options: Parameters<typeof renderWithProviders>[1] = {}) {
  const user = userEvent.setup();
  const rendered = await renderWithProviders(<DashboardPage />, options);
  return { ...rendered, user };
}

const cards = () => screen.queryAllByRole('article');
const card = (name: string) => screen.getByRole('article', { name });
const deleteIn = (name: string) => within(card(name)).getByRole('button', { name: 'Delete' });
const banner = () => screen.queryByRole('region', { name: 'Hit your goal' });
const headerCounter = () => screen.getByRole('status', { name: /applications generated/ });

describe('DashboardPage', () => {
  it('lists every letter, newest first, with the banner while under the goal', async () => {
    await renderPage({ letters: lettersOf(4) });

    expect(cards().map((c) => c.getAttribute('aria-label'))).toEqual([
      'Role 3, Acme',
      'Role 2, Acme',
      'Role 1, Acme',
      'Role 0, Acme',
    ]);
    expect(headerCounter()).toHaveTextContent('4/5');
    expect(within(banner() as HTMLElement).getByText('4 out of 5')).toBeInTheDocument();
  });

  it('shows the badge and no banner once the goal is reached', async () => {
    await renderPage({ letters: lettersOf(5) });

    expect(headerCounter()).toHaveTextContent('5/5');
    expect(banner()).not.toBeInTheDocument();
  });

  it('keeps listing letters past the goal', async () => {
    await renderPage({ letters: lettersOf(6) });

    expect(cards()).toHaveLength(6);
    expect(headerCounter()).toHaveTextContent('5/5');
  });

  it('re-opens the goal when a delete takes the count below it', async () => {
    const { user } = await renderPage({ letters: lettersOf(5) });

    await user.click(deleteIn('Role 2, Acme'));

    expect(cards()).toHaveLength(4);
    expect(headerCounter()).toHaveTextContent('4/5');
    expect(banner()).toBeInTheDocument();
  });

  it('shows the empty panel and the banner at zero letters', async () => {
    await renderPage();

    expect(cards()).toHaveLength(0);
    expect(screen.getByText('Your generated applications will appear here...')).toBeVisible();
    expect(within(banner() as HTMLElement).getByText('0 out of 5')).toBeInTheDocument();
  });

  it('copies the full letter text, not the visible preview', async () => {
    const { user } = await renderPage({ letters: lettersOf(2) });

    await user.click(
      within(card('Role 0, Acme')).getByRole('button', { name: 'Copy to clipboard' }),
    );

    expect(await navigator.clipboard.readText()).toBe('Dear Acme team,\n\nLetter 0 body.');
  });

  it('moves focus to the next card after a delete, and to the title after the last one', async () => {
    const { user } = await renderPage({ letters: lettersOf(3) });

    await user.click(deleteIn('Role 1, Acme'));
    expect(deleteIn('Role 0, Acme')).toHaveFocus();

    await user.click(deleteIn('Role 0, Acme'));
    expect(screen.getByRole('heading', { level: 1, name: 'Applications' })).toHaveFocus();
  });

  it('removes the card and shows a note when storage rejects the delete', async () => {
    const repository = new InMemoryLetterRepository(lettersOf(2));
    repository.rejectWritesWith(new StorageError('quota'));
    const { user } = await renderPage({ repository });

    await user.click(deleteIn('Role 1, Acme'));

    expect(cards()).toHaveLength(1);
    await waitFor(() =>
      expect(screen.getByText(/couldn't save your latest changes/)).toBeInTheDocument(),
    );
  });
});
