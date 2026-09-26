import { screen, within } from '@testing-library/react';
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
  it('shows the empty panel and the goal banner before the first letter', async () => {
    await renderPage();

    expect(cards()).toHaveLength(0);
    expect(screen.getByText('Your generated applications will appear here...')).toBeInTheDocument();
    expect(banner()).toHaveTextContent('0 out of 5');
  });

  it('lists every letter, newest first, with the banner while under the goal', async () => {
    await renderPage({ letters: lettersOf(4) });

    expect(cards().map((c) => c.getAttribute('aria-label'))).toEqual([
      'Role 3, Acme',
      'Role 2, Acme',
      'Role 1, Acme',
      'Role 0, Acme',
    ]);
    expect(headerCounter()).toHaveTextContent('4/5');
    expect(banner()).toHaveTextContent('4 out of 5');
  });

  it('re-opens the goal when a delete takes the count below it', async () => {
    const { user } = await renderPage({ letters: lettersOf(5) });
    expect(banner()).not.toBeInTheDocument();

    await user.click(deleteIn('Role 2, Acme'));

    expect(cards()).toHaveLength(4);
    expect(headerCounter()).toHaveTextContent('4/5');
    expect(banner()).toBeInTheDocument();
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
    expect(await screen.findByText(/couldn't save your latest changes/)).toBeInTheDocument();
  });
});
