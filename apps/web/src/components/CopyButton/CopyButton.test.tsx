import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('says so when the clipboard refuses the text', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    render(<CopyButton text="Dear Apple" />);

    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    expect(await screen.findByRole('button', { name: "Couldn't copy" })).toBeInTheDocument();
    expect(screen.getByText("Couldn't copy", { selector: '[aria-live]' })).toBeInTheDocument();
  });
});
