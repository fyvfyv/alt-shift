import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('while loading stays focusable and ignores clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Generating…
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Generating…' });

    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('with aria-disabled stays focusable and still fires its click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button aria-disabled onClick={onClick}>
        Generate Now
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Generate Now' });

    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
