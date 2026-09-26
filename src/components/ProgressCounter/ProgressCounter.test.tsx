import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressCounter } from './ProgressCounter';

function renderCounter(count: number) {
  const { container } = render(<ProgressCounter count={count} />);
  return {
    status: screen.getByRole('status'),
    dots: container.querySelector('[data-variant="dots"]'),
  };
}

describe('ProgressCounter', () => {
  it('below the goal shows the count and dots', () => {
    const { status, dots } = renderCounter(3);

    expect(status).toHaveAccessibleName('3 of 5 applications generated');
    expect(status).toHaveTextContent('3/5 applications generated');
    expect(dots?.querySelectorAll('[data-active]')).toHaveLength(3);
  });

  it('at the goal swaps the dots for the badge', () => {
    const { status, dots } = renderCounter(5);

    expect(status).toHaveTextContent('5/5 applications generated');
    expect(dots).toBeNull();
    expect(status.querySelector('svg')).toBeInTheDocument();
  });

  it('past the goal still reads 5/5', () => {
    const { status } = renderCounter(6);

    expect(status).toHaveAccessibleName('5 of 5 applications generated');
    expect(status).toHaveTextContent('5/5 applications generated');
  });
});
