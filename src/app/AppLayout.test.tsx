import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { AppLayout } from './AppLayout';

function Crash(): never {
  throw new Error('boom');
}

describe('AppLayout', () => {
  it('keeps the header around a crashed page and recovers on its next navigation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    await renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<h1>Home</h1>} />
          <Route path="boom" element={<Crash />} />
        </Route>
      </Routes>,
      { url: '/boom' },
    );

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reload the app' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('banner')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });
});
