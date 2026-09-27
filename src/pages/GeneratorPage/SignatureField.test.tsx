import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SignatureField } from './SignatureField';

const nameField = () => screen.getByLabelText('Your name');

describe('SignatureField', () => {
  it('Enter saves the trimmed name once and returns focus to the button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SignatureField name="" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Add your name' }));
    await user.type(nameField(), '  Alex Morgan {Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('Alex Morgan');
    expect(screen.getByRole('button', { name: 'Add your name' })).toHaveFocus();
  });

  it('Escape keeps the old name and returns focus to the button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SignatureField name="Alex Morgan" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Change name' }));
    await user.type(nameField(), ' Jr{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Change name' })).toHaveFocus();
  });

  it('leaving the field saves the draft once and leaves focus where it went', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <SignatureField name="" onChange={onChange} />
        <button type="button">Next</button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Add your name' }));
    await user.type(nameField(), 'Alex Morgan');
    await user.tab();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('Alex Morgan');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });
});
