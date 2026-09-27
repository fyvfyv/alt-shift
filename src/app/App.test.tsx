import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { App } from './App';

describe('App', () => {
  it('renders the not-found page with a way back for an unknown URL', async () => {
    await renderWithProviders(<App />, { url: '/nope' });

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page not found · Alt+Shift');
  });

  it('on navigation updates the document title and focuses the new h1', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<App />, { url: '/nope' });

    await user.click(screen.getByRole('link', { name: 'Go to dashboard' }));

    const heading = screen.getByRole('heading', { level: 1, name: 'Applications' });
    expect(document.title).toBe('Applications · Alt+Shift');
    expect(heading).toHaveFocus();
  });

  it('leaves focus alone on the first page of a visit', async () => {
    await renderWithProviders(<App />, { url: '/' });

    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus();
  });
});
