import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('while loading is disabled and busy, shows a spinner and keeps its label for screen readers', () => {
    render(<Button loading>Generating…</Button>);

    const button = screen.getByRole('button', { name: 'Generating…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('with `to` renders a link', () => {
    render(
      <MemoryRouter>
        <Button to="/new">Create New</Button>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Create New' })).toHaveAttribute('href', '/new');
  });
});
