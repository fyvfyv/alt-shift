import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressCounter } from './ProgressCounter';

describe('ProgressCounter', () => {
  it('lights one dot per letter below the goal', () => {
    const { container } = render(<ProgressCounter count={3} />);
    expect(container.querySelectorAll('[data-active]')).toHaveLength(3);
  });

  it('clamps the display at the goal and swaps the dots for the badge', () => {
    render(<ProgressCounter count={6} />);
    const counter = screen.getByRole('status');
    expect(counter).toHaveTextContent('5/5');
    expect(counter.querySelector('[data-active]')).toBeNull();
  });
});
