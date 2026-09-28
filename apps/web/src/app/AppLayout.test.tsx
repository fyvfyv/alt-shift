import { screen } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@test/renderWithProviders';
import { AppLayout } from './AppLayout';

function Crash(): never {
  throw new Error('boom');
}

function Home() {
  const [broken, setBroken] = useState(false);
  if (broken) throw new Error('boom');
  return (
    <>
      <h1>Home</h1>
      <button type="button" onClick={() => setBroken(true)}>
        Break it
      </button>
    </>
  );
}

function renderLayout(url: string, home: ReactNode = <Home />) {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={home} />
        <Route path="boom" element={<Crash />} />
      </Route>
    </Routes>,
    { url },
  );
}

const crashHeading = () => screen.getByRole('heading', { level: 1, name: 'Something went wrong' });

describe('AppLayout', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('keeps the header around a crashed page and recovers on its next navigation', async () => {
    const { user } = await renderLayout('/boom');

    expect(crashHeading()).toHaveFocus();
    expect(document.title).toBe('Something went wrong · Alt+Shift');
    expect(screen.getByRole('alert')).toHaveTextContent('This page stopped working.');

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces a crash that replaces a page already on screen', async () => {
    const { user } = await renderLayout('/');

    await user.click(screen.getByRole('button', { name: 'Break it' }));

    expect(crashHeading()).toHaveFocus();
    expect(document.title).toBe('Something went wrong · Alt+Shift');
  });

  it('announces it again when the fresh try on the next page crashes too', async () => {
    const { user } = await renderLayout('/boom', <Crash />);

    await user.click(screen.getByRole('link', { name: 'Dashboard' }));

    expect(crashHeading()).toHaveFocus();
    expect(document.title).toBe('Something went wrong · Alt+Shift');
  });
});
