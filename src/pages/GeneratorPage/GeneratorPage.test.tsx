import { act, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { type InitialEntry, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryLetterRepository } from '../../features/letters/inMemoryRepository';
import { StorageError } from '../../features/letters/repository';
import type { createFakePort } from '../../test/fakeGenerationPort';
import { lettersOf } from '../../test/letters';
import { renderWithProviders } from '../../test/renderWithProviders';
import { GeneratorPage } from './GeneratorPage';

const field = {
  jobTitle: () => screen.getByLabelText('Job title'),
  company: () => screen.getByLabelText('Company'),
  skills: () => screen.getByLabelText('I am good at...'),
  details: () => screen.getByLabelText('Additional details'),
};

const generateButton = () => screen.getByRole('button', { name: 'Generate Now' });
const tryAgainButton = () => screen.getByRole('button', { name: 'Try Again' });
const previewRegion = () => screen.getByRole('region', { name: 'Your letter' });
const previewPanel = () => within(previewRegion());
const announced = (text: string | RegExp) =>
  screen.getByText(text, { selector: '[role="status"]' });

function RememberLocation({ into }: { into: { current: InitialEntry } }) {
  into.current = useLocation();
  return null;
}

async function fillForm(user: UserEvent, details = 'Ten years of shipping products') {
  await user.type(field.jobTitle(), 'Designer');
  await user.type(field.company(), 'Apple');
  await user.type(field.skills(), 'Figma');
  if (details) await user.type(field.details(), details);
}

async function generateLetter(
  user: UserEvent,
  fake: ReturnType<typeof createFakePort>,
  text: string,
) {
  await user.click(screen.getByRole('button', { name: /Generate Now|Try Again|Retry/ }));
  fake.lastRun().emit(text);
  fake.lastRun().end();
  await screen.findByRole('button', { name: 'Copy to clipboard' });
}

describe('GeneratorPage', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('form', () => {
    it('a press on the inert Generate Now says what is missing and puts the caret there', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      expect(generateButton()).toHaveAttribute('aria-disabled', 'true');

      await user.click(generateButton());
      expect(
        announced("Add a job title, a company and what you're good at to generate."),
      ).toBeInTheDocument();
      expect(field.jobTitle()).toHaveFocus();

      await user.type(field.jobTitle(), 'Designer');
      expect(screen.queryByText(/to generate\.$/)).not.toBeInTheDocument();
      await user.type(field.company(), 'Apple{Enter}');
      expect(generateButton()).toHaveAttribute('aria-disabled', 'true');
      expect(announced("Add what you're good at to generate.")).toBeInTheDocument();
      expect(field.skills()).toHaveFocus();

      await user.type(field.skills(), 'F');
      expect(screen.queryByText(/to generate\.$/)).not.toBeInTheDocument();
      expect(generateButton()).not.toHaveAttribute('aria-disabled');
      expect(fake.runs).toHaveLength(0);
    });

    it('a press on Generate Now with a field over its limit says so and puts the caret there', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user, '');
      await user.click(field.details());
      await user.paste('a'.repeat(1201));
      expect(field.details()).toHaveAccessibleDescription('1201/1200');
      expect(field.details()).toHaveAttribute('aria-invalid', 'true');
      expect(generateButton()).toHaveAttribute('aria-disabled', 'true');

      await user.click(generateButton());
      expect(announced('Shorten the field over its limit to generate.')).toBeInTheDocument();
      expect(field.details()).toHaveFocus();

      await user.click(field.jobTitle());
      await user.paste('a'.repeat(300));
      expect(field.jobTitle()).toHaveAccessibleDescription('Keep it under 300 characters');
      await user.click(generateButton());
      expect(field.jobTitle()).toHaveFocus();
      expect(fake.runs).toHaveLength(0);
    });

    it('counts the details trimmed and by code point, like the validation rule', async () => {
      const { user } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user, '');

      await user.click(field.details());
      await user.paste(`${'a'.repeat(1199)}🚀\n`);

      expect(field.details()).toHaveAccessibleDescription('1200/1200');
      expect(field.details()).not.toHaveAttribute('aria-invalid');
      expect(generateButton()).not.toHaveAttribute('aria-disabled');
    });

    it('titles the page and the tab with the job title and company once both are filled', async () => {
      const { user } = await renderWithProviders(<GeneratorPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('New application');

      await user.type(field.jobTitle(), 'Designer');
      expect(heading).toHaveTextContent('New application');
      expect(document.title).toBe('New application · Alt+Shift');
      await user.type(field.company(), 'Apple');

      expect(heading).toHaveTextContent('Designer, Apple');
      expect(document.title).toBe('Designer, Apple · Alt+Shift');
    });

    it('forgets the typed values once a letter is saved', async () => {
      const first = await renderWithProviders(<GeneratorPage />);
      await fillForm(first.user);
      await generateLetter(first.user, first.fake, 'Dear Apple');
      first.unmount();

      await renderWithProviders(<GeneratorPage />);

      expect(field.jobTitle()).toHaveValue('');
    });

    it('takes a job handed over in history state once, so a reload keeps what was typed over it', async () => {
      const entry: { current: InitialEntry } = {
        current: {
          pathname: '/new',
          state: { prefill: { jobTitle: 'Designer', company: 'Apple' } },
        },
      };
      const first = await renderWithProviders(
        <>
          <GeneratorPage />
          <RememberLocation into={entry} />
        </>,
        { url: entry.current },
      );
      expect(field.jobTitle()).toHaveValue('Designer');
      expect(field.company()).toHaveValue('Apple');

      await first.user.clear(field.company());
      await first.user.type(field.company(), 'Google');
      first.unmount();
      await renderWithProviders(<GeneratorPage />, { url: entry.current });

      expect(field.jobTitle()).toHaveValue('Designer');
      expect(field.company()).toHaveValue('Google');
    });

    it('on arrival puts the caret in Job title, except on a touch screen, where a keyboard would pop up', async () => {
      const first = await renderWithProviders(<GeneratorPage />);
      expect(field.jobTitle()).toHaveFocus();
      first.unmount();

      const matchMedia = window.matchMedia;
      vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        ...matchMedia(query),
        matches: query === '(hover: none) and (pointer: coarse)',
      }));

      await renderWithProviders(<GeneratorPage />);

      expect(field.jobTitle()).not.toHaveFocus();
    });

    it('Ctrl+Enter from the details field sends the form fields to the port', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);

      await user.type(field.details(), '{Control>}{Enter}{/Control}');

      expect(fake.runs.map((run) => run.request)).toEqual([
        {
          jobTitle: 'Designer',
          company: 'Apple',
          skills: 'Figma',
          details: 'Ten years of shipping products',
        },
      ]);
    });
  });

  describe('generation', () => {
    it('shows the orb until the first text arrives, then streams the letter', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);

      await user.click(generateButton());

      const orb = () => previewRegion().querySelector('[aria-hidden]');
      expect(orb()).toBeInTheDocument();
      const cta = screen.getByRole('button', { name: 'Generating…' });
      expect(cta).toHaveAttribute('aria-busy', 'true');
      expect(cta).toHaveFocus();
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
      expect(tryAgainButton()).toHaveFocus();
    });

    it('announces a run as it starts and the letter once it is ready, not while it streams', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);

      await user.click(generateButton());
      expect(announced('Generating your letter…')).toBeInTheDocument();

      fake.lastRun().emit('Dear Apple');
      await screen.findByText('Dear Apple');
      expect(announced('Generating your letter…')).toBeInTheDocument();

      fake.lastRun().end();
      await screen.findByRole('button', { name: 'Copy to clipboard' });
      expect(announced(/^Your letter is ready\./)).toBeInTheDocument();
    });

    it('captions the orb after 2 s, and admits the wait after 8 s', async () => {
      // Fake only the clocks: user-event and RTL wait on the real setTimeout.
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      const { user } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await user.click(generateButton());

      act(() => vi.advanceTimersByTime(1_000));
      expect(screen.queryByText('Generating')).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1_000));
      expect(screen.getByText('Generating')).toBeInTheDocument();
      expect(screen.getByText('Writing your letter for Apple…')).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(6_000));
      expect(screen.getByText('Almost there…')).toBeInTheDocument();
    });

    it('when the preview sits beside the form leaves the scroll position alone', async () => {
      vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockReturnValue(32);
      const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
      const { user } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);

      await user.click(generateButton());

      expect(scroll).not.toHaveBeenCalled();
    });

    it('after completion saves one letter, offers Try Again and counts it toward the goal', async () => {
      const { user, fake, store } = await renderWithProviders(<GeneratorPage />, {
        letters: lettersOf(4),
      });
      await fillForm(user);

      await generateLetter(user, fake, 'Dear Apple');

      expect(store.getState().letters).toHaveLength(5);
      expect(tryAgainButton()).toBeEnabled();
      const banner = screen.getByRole('region', { name: 'You hit your goal' });
      expect(within(banner).getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    });

    it('after an edit offers Generate Now again and the next run adds a second letter', async () => {
      const { user, fake, store } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'For Apple');

      await user.clear(field.company());
      await user.type(field.company(), 'Google');
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
      await generateLetter(user, fake, 'For Google');

      expect(store.getState().letters.map((l) => l.text)).toEqual(['For Google', 'For Apple']);
    });

    it("the banner's Create New empties the job and preview but keeps the profile, and the next run is a new letter", async () => {
      const { user, fake, store } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'For Apple');

      await user.click(screen.getByRole('button', { name: 'Create New' }));

      expect(field.jobTitle()).toHaveValue('');
      expect(field.jobTitle()).toHaveFocus();
      expect(field.company()).toHaveValue('');
      expect(field.skills()).toHaveValue('Figma');
      expect(field.details()).toHaveValue('Ten years of shipping products');
      expect(await screen.findByText(/will appear here/)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Hit your goal' })).not.toBeInTheDocument();

      await user.type(field.jobTitle(), 'Designer');
      await user.type(field.company(), 'Apple');
      await generateLetter(user, fake, 'Again for Apple');
      expect(store.getState().letters).toHaveLength(2);
    });

    it('when the page unmounts mid-stream aborts the run and saves nothing', async () => {
      const { user, fake, unmount, repository } = await renderWithProviders(<GeneratorPage />);
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
      const { user, fake } = await renderWithProviders(<GeneratorPage />, { repository });
      await fillForm(user);

      await generateLetter(user, fake, 'Dear Apple');

      expect(screen.getByText('Dear Apple')).toBeInTheDocument();
      expect(await screen.findByText(/couldn't save your latest changes/)).toBeInTheDocument();
    });

    it('signs the letter with the name added in the footer, and copies it signed', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'Dear Apple,\n\nSincerely,');

      await user.click(screen.getByRole('button', { name: 'Add your name' }));
      await user.type(screen.getByLabelText('Your name'), 'Alex Morgan{Enter}');

      expect(screen.getByText('Sincerely, Alex Morgan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Change name' })).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
      expect(await navigator.clipboard.readText()).toBe('Dear Apple,\n\nSincerely,\nAlex Morgan');
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
  });

  describe('errors', () => {
    it('on a rate limit makes both buttons inert until the countdown ends, then Retry runs again', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await user.click(generateButton());

      fake.lastRun().fail({ kind: 'rate-limit', retryAfterSeconds: 1 });

      expect(await screen.findByText('Too many requests')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry in 1s' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(generateButton()).toHaveAttribute('aria-disabled', 'true');
      await user.click(screen.getByRole('button', { name: 'Retry in 1s' }));
      await user.click(generateButton());
      expect(fake.runs).toHaveLength(1);

      act(() => vi.advanceTimersByTime(1_000));
      expect(generateButton()).not.toHaveAttribute('aria-disabled');
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(fake.runs).toHaveLength(2);
    });

    it('a Try Again that hits the rate limit keeps the letter, its Copy and the focus until it can run', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
      const { user, fake, store } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'First draft');
      const cta = tryAgainButton();

      await user.click(cta);
      fake.lastRun().fail({ kind: 'rate-limit', retryAfterSeconds: 1 });

      expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests');
      expect(screen.getByText('First draft')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Hit your goal' })).toBeInTheDocument();
      expect(cta).toHaveAccessibleName('Try Again');
      expect(cta).not.toBeDisabled();
      expect(cta).toHaveAttribute('aria-disabled', 'true');
      expect(cta).toHaveFocus();
      expect(previewPanel().getByRole('button', { name: 'Retry in 1s' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );

      act(() => vi.advanceTimersByTime(1_000));
      expect(cta).not.toHaveAttribute('aria-disabled');
      await user.click(previewPanel().getByRole('button', { name: 'Try Again' }));
      fake.lastRun().emit('Second draft');
      fake.lastRun().end();
      await screen.findByText('Second draft');

      await waitFor(() =>
        expect(store.getState().letters.map((l) => l.text)).toEqual(['Second draft']),
      );
    });

    it("the panel's Try Again hands focus to the CTA, which stays while the orb replaces the panel", async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'First draft');
      await user.click(tryAgainButton());
      fake.lastRun().fail({ kind: 'upstream' });
      await screen.findByRole('alert');

      await user.click(previewPanel().getByRole('button', { name: 'Try Again' }));

      expect(screen.getByRole('button', { name: 'Generating…' })).toHaveFocus();
      fake.lastRun().emit('Second draft');
      fake.lastRun().end();
      expect(await screen.findByRole('button', { name: 'Try Again' })).toHaveFocus();
    });

    it.each([
      ['upstream' as const, 'Generation failed'],
      ['network' as const, 'You appear to be offline'],
    ])('on a %s error shows the message and Retry runs again', async (kind, title) => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await user.click(generateButton());

      fake.lastRun().fail({ kind });

      expect(await screen.findByRole('alert')).toHaveTextContent(title);
      expect(generateButton()).not.toHaveAttribute('aria-disabled');
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(fake.runs).toHaveLength(2);
    });

    it('makes Retry inert once a required field is cleared', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await user.click(generateButton());
      fake.lastRun().fail({ kind: 'upstream' });
      await screen.findByRole('alert');

      await user.clear(field.jobTitle());

      expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('while offline makes Try Again inert and says so under it, until back online', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'Dear Apple');
      const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      act(() => void window.dispatchEvent(new Event('offline')));
      expect(tryAgainButton()).toHaveAttribute('aria-disabled', 'true');
      expect(announced(/Generating will work again/)).toBeInTheDocument();
      await user.click(tryAgainButton());
      expect(fake.runs).toHaveLength(1);

      onLine.mockReturnValue(true);
      act(() => void window.dispatchEvent(new Event('online')));
      expect(tryAgainButton()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(/Generating will work again/)).not.toBeInTheDocument();
    });

    it('leaves the offline note out while the preview already shows the network error, whose Retry waits too', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await user.click(generateButton());
      fake.lastRun().fail({ kind: 'network' });
      await screen.findByRole('alert');
      const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      act(() => void window.dispatchEvent(new Event('offline')));

      expect(screen.queryByText(/Generating will work again/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      onLine.mockReturnValue(true);
      act(() => void window.dispatchEvent(new Event('online')));
      expect(screen.getByRole('button', { name: 'Retry' })).not.toHaveAttribute('aria-disabled');
    });

    it('a new letter that fails before any text names the job of the letter still shown, above it', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'For Apple');
      await user.clear(field.company());
      await user.type(field.company(), 'Google');

      await user.click(generateButton());
      fake.lastRun().fail({ kind: 'upstream' });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Showing your previous letter, Designer, Apple.');
      expect(
        alert.compareDocumentPosition(screen.getByText('For Apple')) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('a cut Try Again keeps the saved letter on screen with its Copy, through a failure after it', async () => {
      const { user, fake, store } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'First draft');

      await user.click(tryAgainButton());
      fake.lastRun().emit('Sec');
      fake.lastRun().fail({ kind: 'stream-cut' });
      expect(
        await previewPanel().findByText('The letter was cut short. Your previous letter is kept.'),
      ).toBeInTheDocument();
      expect(
        announced('The letter was cut short. Your previous letter is kept.'),
      ).toBeInTheDocument();
      expect(previewPanel().getByText('First draft')).toBeInTheDocument();
      expect(previewPanel().queryByText('Sec')).not.toBeInTheDocument();
      expect(previewPanel().getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();

      await user.click(previewPanel().getByRole('button', { name: 'Try Again' }));
      fake.lastRun().fail({ kind: 'upstream' });

      expect(await screen.findByRole('alert')).toHaveTextContent('Your previous letter is kept.');
      expect(previewPanel().getByText('First draft')).toBeInTheDocument();
      expect(previewPanel().getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Generate Now' })).not.toBeInTheDocument();
      await user.click(previewPanel().getByRole('button', { name: 'Try Again' }));
      fake.lastRun().emit('Second draft');
      fake.lastRun().end();
      await screen.findByText('Second draft');
      await waitFor(() =>
        expect(store.getState().letters.map((l) => l.text)).toEqual(['Second draft']),
      );
    });

    it('after an edit keeps the letter a cut Try Again left on screen, naming its job', async () => {
      const { user, fake } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await generateLetter(user, fake, 'First draft');
      await user.click(tryAgainButton());
      fake.lastRun().emit('Sec');
      fake.lastRun().fail({ kind: 'stream-cut' });
      await previewPanel().findByText('First draft');

      await user.clear(field.company());
      await user.type(field.company(), 'Google');

      expect(previewPanel().getByText('First draft')).toBeInTheDocument();
      expect(
        previewPanel().getByText(
          'The letter was cut short. Showing your previous letter, Designer, Apple.',
        ),
      ).toBeInTheDocument();
      expect(generateButton()).toBeInTheDocument();
    });

    it('when the stream is cut keeps the partial text, saves nothing and offers Try Again until an edit', async () => {
      const { user, fake, store } = await renderWithProviders(<GeneratorPage />);
      await fillForm(user);
      await user.click(generateButton());

      fake.lastRun().emit('Dear Ap');
      fake.lastRun().fail({ kind: 'stream-cut' });

      expect(await previewPanel().findByText('The letter was cut short.')).toBeInTheDocument();
      expect(announced('The letter was cut short.')).toBeInTheDocument();
      expect(screen.getByText('Dear Ap')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Try Again' })).toHaveLength(2);
      expect(store.getState().letters).toEqual([]);

      await user.type(field.company(), ' Inc');

      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
      expect(generateButton()).toBeInTheDocument();
      expect(previewPanel().getByText('The letter was cut short.')).toBeInTheDocument();
    });
  });
});
