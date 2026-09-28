import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('speaks a new error through a status that was there before it', () => {
    const { rerender } = render(<TextField label="Company" />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    rerender(<TextField label="Company" error="Keep it under 300 characters" />);

    expect(status).toHaveTextContent('Keep it under 300 characters');
    expect(screen.getByLabelText('Company')).toHaveAccessibleDescription(
      'Keep it under 300 characters',
    );
  });
});
