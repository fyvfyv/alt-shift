import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryLetterRepository } from '@services/letters/inMemoryRepository';
import { StorageError } from '@services/letters/repository';
import { lettersOf } from '@test/letters';
import { renderWithProviders } from '@test/renderWithProviders';
import { DashboardPage } from './DashboardPage';

const cards = () => screen.queryAllByRole('article');
const card = (name: string) => screen.getByRole('article', { name });
const deleteIn = (name: string) => within(card(name)).getByRole('button', { name: 'Delete' });
const banner = () => screen.queryByRole('region', { name: 'Hit your goal' });
const announced = (text: string) => screen.getByText(text, { selector: '[role="status"]' });
const request = (company: string) => ({ jobTitle: 'Engineer', company, skills: 'Go', details: '' });

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

  describe('letters on their way', () => {
    it('shows them among the saved ones, newest first, until one is written and joins them', async () => {
      const { fake, queue } = await renderWithProviders(<DashboardPage />, {
        letters: lettersOf(1),
      });

      act(() => {
        queue.store.getState().enqueue({ id: 'stripe', request: request('Stripe') });
        queue.store.getState().enqueue({ id: 'google', request: request('Google') });
      });

      expect(cards().map((c) => c.getAttribute('aria-label'))).toEqual([
        'Engineer, Google',
        'Engineer, Stripe',
        'Role 0, Acme',
      ]);
      expect(card('Engineer, Stripe')).toHaveAccessibleDescription('Writing…');
      expect(
        within(card('Engineer, Google')).getByText('Starts after your letter for Stripe.'),
      ).toBeVisible();
      expect(banner()).toHaveTextContent('1 out of 5');

      fake.lastRun().emit('Dear Stripe team,');
      expect(await within(card('Engineer, Stripe')).findByText('Dear Stripe team,')).toBeVisible();
      fake.lastRun().end();

      await waitFor(() =>
        expect(
          within(card('Engineer, Stripe')).getByRole('button', { name: 'Copy to clipboard' }),
        ).toBeInTheDocument(),
      );
      expect(announced('Engineer, Stripe is ready.')).toBeInTheDocument();
      expect(banner()).toHaveTextContent('2 out of 5');
      expect(card('Engineer, Google')).toHaveAccessibleDescription('Writing…');
    });

    it('Cancel stops a letter being written and hands focus to the next card', async () => {
      const { user, fake, queue } = await renderWithProviders(<DashboardPage />, {
        letters: lettersOf(1),
      });
      act(() => queue.store.getState().enqueue({ id: 'stripe', request: request('Stripe') }));

      await user.click(within(card('Engineer, Stripe')).getByRole('button', { name: 'Cancel' }));

      expect(fake.lastRun().signal.aborted).toBe(true);
      expect(cards()).toHaveLength(1);
      expect(deleteIn('Role 0, Acme')).toHaveFocus();
    });

    it("a card that has focus when its letter is written hands it to the letter's Copy", async () => {
      const { fake, queue } = await renderWithProviders(<DashboardPage />);
      act(() => queue.store.getState().enqueue({ id: 'stripe', request: request('Stripe') }));
      act(() => within(card('Engineer, Stripe')).getByRole('button', { name: 'Cancel' }).focus());

      fake.lastRun().emit('Dear Stripe team,');
      fake.lastRun().end();

      await waitFor(() =>
        expect(
          within(card('Engineer, Stripe')).getByRole('button', { name: 'Copy to clipboard' }),
        ).toHaveFocus(),
      );
    });

    it('a letter that failed offers Try Again, which writes it again in the same card', async () => {
      const { user, fake, queue, store } = await renderWithProviders(<DashboardPage />);
      act(() => queue.store.getState().enqueue({ id: 'stripe', request: request('Stripe') }));
      fake.lastRun().fail({ kind: 'upstream' });

      const failed = await screen.findByRole('article', { name: 'Engineer, Stripe' });
      expect(
        within(failed).getByText(
          'Generation failed. Something went wrong on our side. Your inputs are safe.',
        ),
      ).toBeVisible();
      expect(announced("Engineer, Stripe couldn't be written.")).toBeInTheDocument();

      await user.click(within(failed).getByRole('button', { name: 'Try Again' }));

      expect(within(failed).getByRole('button', { name: 'Cancel' })).toHaveFocus();
      fake.lastRun().emit('Dear Stripe team,');
      fake.lastRun().end();
      await waitFor(() => expect(store.getState().letters.map((l) => l.id)).toEqual(['stripe']));
    });

    it('a letter getting a new version stays usable, and says the new one is on its way', async () => {
      const { queue } = await renderWithProviders(<DashboardPage />, { letters: lettersOf(1) });

      act(() => queue.store.getState().enqueue({ id: 'letter-0', request: request('Acme') }));

      const letter = card('Role 0, Acme');
      expect(letter).toHaveAccessibleDescription('Writing a new version…');
      expect(within(letter).getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
    });
  });
});
