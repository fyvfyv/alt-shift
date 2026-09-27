import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryLetterRepository } from '../../features/letters/inMemoryRepository';
import { StorageError } from '../../features/letters/repository';
import { lettersOf } from '../../test/letters';
import { renderWithProviders } from '../../test/renderWithProviders';
import { DashboardPage } from './DashboardPage';

const cards = () => screen.queryAllByRole('article');
const card = (name: string) => screen.getByRole('article', { name });
const deleteIn = (name: string) => within(card(name)).getByRole('button', { name: 'Delete' });
const banner = () => screen.queryByRole('region', { name: 'Hit your goal' });

afterEach(() => vi.restoreAllMocks());

describe('DashboardPage', () => {
  it('lists letters newest first and re-opens the goal when a delete takes the count below it', async () => {
    const { user } = await renderWithProviders(<DashboardPage />, { letters: lettersOf(5) });
    expect(banner()).not.toBeInTheDocument();

    await user.click(deleteIn('Role 2, Acme'));

    expect(cards().map((c) => c.getAttribute('aria-label'))).toEqual([
      'Role 4, Acme',
      'Role 3, Acme',
      'Role 1, Acme',
      'Role 0, Acme',
    ]);
    expect(banner()).toHaveTextContent('4 out of 5');
  });

  it('moves focus to the next card after a delete, and to the title after the last one', async () => {
    const { user } = await renderWithProviders(<DashboardPage />, { letters: lettersOf(3) });

    await user.click(deleteIn('Role 1, Acme'));
    expect(deleteIn('Role 0, Acme')).toHaveFocus();

    await user.click(deleteIn('Role 0, Acme'));
    expect(screen.getByRole('heading', { level: 1, name: 'Applications' })).toHaveFocus();
  });

  it('removes the card and shows a note when storage rejects the delete', async () => {
    const repository = new InMemoryLetterRepository(lettersOf(2));
    repository.rejectWritesWith(new StorageError('quota'));
    const { user } = await renderWithProviders(<DashboardPage />, { repository });

    await user.click(deleteIn('Role 1, Acme'));

    expect(cards()).toHaveLength(1);
    expect(await screen.findByText(/couldn't save your latest changes/)).toBeInTheDocument();
  });

  it('signs a letter that stops on a sign-off with the profile name, on screen and when copied', async () => {
    localStorage.setItem('alt-shift.profile', JSON.stringify({ name: 'Jane Doe' }));
    const text = 'Dear Acme team,\n\nThank you.\n\nSincerely,';
    const { user } = await renderWithProviders(<DashboardPage />, {
      letters: lettersOf(1, { text }),
    });
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    const signed = card('Role 0, Acme');
    expect(within(signed).getByText(/Sincerely,\s*Jane Doe$/)).toBeInTheDocument();

    await user.click(within(signed).getByRole('button', { name: 'Copy to clipboard' }));

    expect(writeText).toHaveBeenCalledWith(`${text}\nJane Doe`);
  });
});
