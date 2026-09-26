import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryLetterRepository } from '../../features/letters/inMemoryRepository';
import { createLetter, type Letter } from '../../features/letters/model';
import { StorageError } from '../../features/letters/repository';
import { createFakePort } from '../../test/fakeGenerationPort';
import { renderWithProviders } from '../../test/renderWithProviders';
import { GeneratorPage } from './GeneratorPage';

type User = ReturnType<typeof userEvent.setup>;

const field = {
  jobTitle: () => screen.getByLabelText('Job title'),
  company: () => screen.getByLabelText('Company'),
  skills: () => screen.getByLabelText('I am good at...'),
  details: () => screen.getByLabelText('Additional details'),
};

const generateButton = () => screen.getByRole('button', { name: 'Generate Now' });
const tryAgainButton = () => screen.getByRole('button', { name: 'Try Again' });

function lettersOf(count: number): Letter[] {
  return Array.from({ length: count }, (_, i) =>
    createLetter({ jobTitle: `Role ${i}`, company: 'Acme', text: `Letter ${i}` }),
  );
}

async function renderPage(options: Parameters<typeof renderWithProviders>[1] = {}) {
  const fake = createFakePort();
  const user = userEvent.setup();
  const rendered = await renderWithProviders(<GeneratorPage />, {
    url: '/new',
    port: fake.port,
    ...options,
  });
  return { ...rendered, fake, user };
}

async function fillForm(user: User, details = 'Ten years of shipping products') {
  await user.type(field.jobTitle(), 'Designer');
  await user.type(field.company(), 'Apple');
  await user.type(field.skills(), 'Figma');
  if (details) await user.type(field.details(), details);
}

// Streams a whole letter through the fake and waits until the page shows it as finished.
async function generateLetter(user: User, fake: ReturnType<typeof createFakePort>, text: string) {
  await user.click(screen.getByRole('button', { name: /Generate Now|Try Again|Retry/ }));
  fake.lastRun().emit(text);
  fake.lastRun().end();
  await screen.findByRole('button', { name: 'Copy to clipboard' });
}

describe('GeneratorPage', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('form', () => {
    it('keeps Generate Now disabled until the required fields are filled', async () => {
      const { user } = await renderPage();

      expect(generateButton()).toBeDisabled();
      await user.type(field.jobTitle(), 'Designer');
      await user.type(field.company(), 'Apple');
      expect(generateButton()).toBeDisabled();

      await user.type(field.skills(), 'Figma');
      expect(generateButton()).toBeEnabled();
    });

    it('disables Generate Now when the details run past 1200 characters', async () => {
      const { user } = await renderPage();
      await fillForm(user, '');

      await user.click(field.details());
      await user.paste('a'.repeat(1201));

      expect(field.details()).toHaveAccessibleDescription('1201/1200');
      expect(field.details()).toHaveAttribute('aria-invalid', 'true');
      expect(generateButton()).toBeDisabled();
    });

    it('counts the details trimmed and by code point, like the validation rule', async () => {
      const { user } = await renderPage();
      await fillForm(user, '');

      await user.click(field.details());
      await user.paste(`${'a'.repeat(1199)}🚀\n`);

      expect(field.details()).toHaveAccessibleDescription('1200/1200');
      expect(field.details()).not.toHaveAttribute('aria-invalid');
      expect(generateButton()).toBeEnabled();
    });

    it('shows a field error and disables Generate Now for a job title over 300 characters', async () => {
      const { user } = await renderPage();
      await fillForm(user);

      await user.click(field.jobTitle());
      await user.paste('a'.repeat(300));

      expect(field.jobTitle()).toHaveAccessibleDescription('Keep it under 300 characters');
      expect(generateButton()).toBeDisabled();
    });

    it('titles the page with the job title and company once both are filled', async () => {
      const { user } = await renderPage();
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('New application');

      await user.type(field.jobTitle(), 'Designer');
      expect(heading).toHaveTextContent('New application');
      await user.type(field.company(), 'Apple');

      expect(heading).toHaveTextContent('Designer, Apple');
    });

    it('restores the typed values after the page is remounted', async () => {
      const first = await renderPage();
      await fillForm(first.user);
      first.unmount();

      await renderPage();

      expect(field.jobTitle()).toHaveValue('Designer');
      expect(field.details()).toHaveValue('Ten years of shipping products');
    });

    it('forgets the typed values once a letter is saved', async () => {
      const first = await renderPage();
      await fillForm(first.user);
      await generateLetter(first.user, first.fake, 'Dear Apple');
      first.unmount();

      await renderPage();

      expect(field.jobTitle()).toHaveValue('');
    });
  });

  describe('generation', () => {
    it('shows the orb until the first text arrives, then streams the letter', async () => {
      const { user, fake, container } = await renderPage();
      await fillForm(user);

      await user.click(generateButton());

      const orb = () => container.querySelector('[aria-live="polite"] [aria-hidden]');
      expect(orb()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Generating…' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
      expect(field.jobTitle()).toHaveAttribute('readonly');

      fake.lastRun().emit('Dear Apple');
      await screen.findByText('Dear Apple');
      expect(orb()).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Copy to clipboard' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Hit your goal' })).not.toBeInTheDocument();

      fake.lastRun().emit(' team,');
      fake.lastRun().end();
      expect(await screen.findByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
      expect(screen.getByText('Dear Apple team,')).toBeInTheDocument();
    });

    it('in the stacked layout scrolls the preview into view when generation starts', async () => {
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const { user, container } = await renderPage();
      await fillForm(user);

      await user.click(generateButton());

      expect(scroll).toHaveBeenCalledWith({ block: 'start' });
      expect(scroll.mock.contexts[0]).toBe(container.querySelector('[aria-live="polite"]'));
    });

    it('in the two-column layout leaves the scroll position alone', async () => {
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1120);
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const { user } = await renderPage();
      await fillForm(user);

      await user.click(generateButton());

      expect(scroll).not.toHaveBeenCalled();
    });

    it('sends the form fields to the port', async () => {
      const { user, fake } = await renderPage();
      await fillForm(user);

      await user.click(generateButton());

      expect(fake.lastRun().request).toEqual({
        jobTitle: 'Designer',
        company: 'Apple',
        skills: 'Figma',
        details: 'Ten years of shipping products',
      });
    });

    it('keeps the text of the last frame when the stream ends right after it', async () => {
      const { user, fake, repository } = await renderPage();
      await fillForm(user);

      await user.click(generateButton());
      fake.lastRun().emit('Dear ', 'Apple', ' team,');
      fake.lastRun().end();

      expect(await screen.findByText('Dear Apple team,')).toBeInTheDocument();
      await waitFor(async () => expect(await repository.list()).toHaveLength(1));
      expect((await repository.list())[0]).toMatchObject({
        jobTitle: 'Designer',
        company: 'Apple',
        text: 'Dear Apple team,',
      });
    });

    it('after completion saves one letter, offers Try Again and shows the goal banner', async () => {
      const { user, fake, store } = await renderPage({ letters: lettersOf(2) });
      await fillForm(user);

      await generateLetter(user, fake, 'Dear Apple');

      expect(store.getState().letters).toHaveLength(3);
      expect(tryAgainButton()).toBeEnabled();
      expect(screen.getByRole('heading', { name: 'Hit your goal' })).toBeInTheDocument();
      expect(screen.getByText('3 out of 5')).toBeInTheDocument();
    });

    it('Try Again replaces the letter instead of adding one', async () => {
      const { user, fake, store } = await renderPage();
      await fillForm(user);
      await generateLetter(user, fake, 'First draft');

      await generateLetter(user, fake, 'Second draft');

      expect(store.getState().letters.map((l) => l.text)).toEqual(['Second draft']);
    });

    it('after an edit offers Generate Now again and the next run adds a second letter', async () => {
      const { user, fake, store } = await renderPage();
      await fillForm(user);
      await generateLetter(user, fake, 'For Apple');

      await user.clear(field.company());
      await user.type(field.company(), 'Google');
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
      await generateLetter(user, fake, 'For Google');

      expect(store.getState().letters.map((l) => l.text)).toEqual(['For Google', 'For Apple']);
    });

    it("the banner's Create New empties the form and preview, and the next run is a new letter", async () => {
      const { user, fake, store } = await renderPage();
      await fillForm(user);
      await generateLetter(user, fake, 'For Apple');

      await user.click(screen.getByRole('button', { name: 'Create New' }));

      expect(field.jobTitle()).toHaveValue('');
      expect(field.jobTitle()).toHaveFocus();
      expect(field.details()).toHaveValue('');
      expect(await screen.findByText(/will appear here/)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Hit your goal' })).not.toBeInTheDocument();

      await fillForm(user);
      await generateLetter(user, fake, 'Again for Apple');
      expect(store.getState().letters).toHaveLength(2);
    });

    it('when the page unmounts mid-stream aborts the run and saves nothing', async () => {
      const { user, fake, unmount, repository } = await renderPage();
      await fillForm(user);
      await user.click(generateButton());
      fake.lastRun().emit('Dear');
      await screen.findByText('Dear');

      unmount();
      fake.lastRun().end();
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

      expect(fake.lastRun().signal.aborted).toBe(true);
      expect(await repository.list()).toEqual([]);
    });

    it('still shows the letter, with a note, when storage fails', async () => {
      const repository = new InMemoryLetterRepository();
      repository.rejectWritesWith(new StorageError('quota'));
      const { user, fake } = await renderPage({ repository });
      await fillForm(user);

      await generateLetter(user, fake, 'Dear Apple');

      expect(screen.getByText('Dear Apple')).toBeInTheDocument();
      expect(await screen.findByText(/couldn't save your latest changes/)).toBeInTheDocument();
    });

    it('copies the letter to the clipboard', async () => {
      const { user, fake } = await renderPage();
      await fillForm(user);
      await generateLetter(user, fake, 'Dear Apple');

      await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

      expect(await navigator.clipboard.readText()).toBe('Dear Apple');
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
  });

  describe('errors', () => {
    it('on a rate limit disables both buttons until the countdown ends, then Retry runs again', async () => {
      const { user, fake } = await renderPage();
      await fillForm(user);
      await user.click(generateButton());

      fake.lastRun().fail({ kind: 'rate-limit', retryAfterSeconds: 1 });

      expect(await screen.findByText('Too many requests')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry in 1s' })).toBeDisabled();
      expect(generateButton()).toBeDisabled();
      const retry = await screen.findByRole('button', { name: 'Retry' }, { timeout: 2000 });
      expect(generateButton()).toBeEnabled();

      await user.click(retry);
      expect(fake.runs).toHaveLength(2);
    });

    it.each([
      ['upstream' as const, 'Generation failed'],
      ['network' as const, 'You appear to be offline'],
    ])('on a %s error shows the message and Retry runs again', async (kind, title) => {
      const { user, fake } = await renderPage();
      await fillForm(user);
      await user.click(generateButton());

      fake.lastRun().fail({ kind });

      expect(await screen.findByRole('alert')).toHaveTextContent(title);
      expect(generateButton()).toBeEnabled();
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(fake.runs).toHaveLength(2);
    });

    it('disables Retry once a required field is cleared', async () => {
      const { user, fake } = await renderPage();
      await fillForm(user);
      await user.click(generateButton());
      fake.lastRun().fail({ kind: 'upstream' });
      await screen.findByRole('alert');

      await user.clear(field.jobTitle());

      expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    });

    it('a Retry after a failed Try Again replaces the letter instead of adding one', async () => {
      const { user, fake, store } = await renderPage();
      await fillForm(user);
      await generateLetter(user, fake, 'First draft');

      await user.click(tryAgainButton());
      fake.lastRun().fail({ kind: 'upstream' });
      await user.click(await screen.findByRole('button', { name: 'Retry' }));
      fake.lastRun().emit('Second draft');
      fake.lastRun().end();
      await screen.findByText('Second draft');

      await waitFor(() =>
        expect(store.getState().letters.map((l) => l.text)).toEqual(['Second draft']),
      );
    });

    it('while offline disables Try Again, and enables it once back online', async () => {
      const { user, fake } = await renderPage();
      await fillForm(user);
      await generateLetter(user, fake, 'Dear Apple');
      const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      act(() => void window.dispatchEvent(new Event('offline')));
      expect(tryAgainButton()).toBeDisabled();

      onLine.mockReturnValue(true);
      act(() => void window.dispatchEvent(new Event('online')));
      expect(tryAgainButton()).toBeEnabled();
    });

    it('when the stream is cut keeps the partial text, offers Try Again and saves nothing', async () => {
      const { user, fake, store } = await renderPage();
      await fillForm(user);
      await user.click(generateButton());

      fake.lastRun().emit('Dear Ap');
      fake.lastRun().fail({ kind: 'stream-cut' });

      expect(await screen.findByText('The letter was cut short.')).toBeInTheDocument();
      expect(screen.getByText('Dear Ap')).toBeInTheDocument();
      expect(tryAgainButton()).toBeEnabled();
      expect(store.getState().letters).toEqual([]);
    });
  });
});
