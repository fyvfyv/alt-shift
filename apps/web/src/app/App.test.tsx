import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { copy } from '@copy';
import { renderWithProviders } from '@test/renderWithProviders';
import { App } from './App';

describe('App', () => {
  it('on navigation updates the document title and focuses the new h1', async () => {
    const { user } = await renderWithProviders(<App />, { url: '/nope' });

    await user.click(screen.getByRole('link', { name: 'Go to dashboard' }));

    const heading = screen.getByRole('heading', { level: 1, name: 'Applications' });
    expect(document.title).toBe('Applications · Alt+Shift');
    expect(heading).toHaveFocus();
  });

  // Only in-app navigation also focuses the h1, so only here can it steal Job title's focus.
  it('puts the caret in Job title after Create New on the dashboard', async () => {
    const { user } = await renderWithProviders(<App />, { url: '/' });

    const banner = screen.getByRole('region', { name: 'Hit your goal' });
    await user.click(within(banner).getByRole('link', { name: 'Create New' }));

    expect(screen.getByLabelText('Job title')).toHaveFocus();
  });

  it('Try an example on the empty dashboard opens the generator filled with the example', async () => {
    const { user } = await renderWithProviders(<App />, { url: '/' });

    await user.click(screen.getByRole('link', { name: 'Try an example' }));

    const example = copy.example.request;
    expect(screen.getByLabelText('Job title')).toHaveValue(example.jobTitle);
    expect(screen.getByLabelText('Company')).toHaveValue(example.company);
    expect(screen.getByLabelText('I am good at...')).toHaveValue(example.skills);
    expect(screen.getByLabelText('Additional details')).toHaveValue(example.details);
  });

  it('leaves focus alone on the first page of a visit', async () => {
    await renderWithProviders(<App />, { url: '/' });

    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus();
  });

  it('while a letter is on its way asks before the tab closes, and starts the next one blank', async () => {
    const { user, fake } = await renderWithProviders(<App />, { url: '/new' });
    const leaving = () => {
      const event = new Event('beforeunload', { cancelable: true });
      act(() => void window.dispatchEvent(event));
      return event.defaultPrevented;
    };
    expect(leaving()).toBe(false);
    await user.type(screen.getByLabelText('Job title'), 'Designer');
    await user.type(screen.getByLabelText('Company'), 'Apple');
    await user.type(screen.getByLabelText('I am good at...'), 'Figma');
    await user.click(screen.getByRole('button', { name: 'Generate Now' }));
    expect(leaving()).toBe(true);

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    await user.click(screen.getAllByRole('link', { name: 'Create New' })[0] as HTMLElement);

    expect(screen.getByLabelText('Job title')).toHaveValue('');
    expect(screen.getByText('Your letter for Apple is still being written.')).toBeInTheDocument();
    fake.lastRun().emit('Dear Apple');
    fake.lastRun().end();
    await waitFor(() => expect(leaving()).toBe(false));
  });
});
