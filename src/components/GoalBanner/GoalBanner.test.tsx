import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GoalBanner } from './GoalBanner';

const action = <button type="button">Create New</button>;

describe('GoalBanner', () => {
  it.each([
    [0, 'Generate your first job application to get hired faster'],
    [4, 'One more job application and you hit your goal'],
  ])('at %i pitches the next step', (count, subtitle) => {
    render(<GoalBanner count={count} action={action} />);
    expect(screen.getByText(subtitle)).toBeInTheDocument();
  });

  it('at the goal renders nothing unless given a next step to offer', () => {
    const { container, rerender } = render(<GoalBanner count={5} action={action} />);
    expect(container).toBeEmptyDOMElement();

    rerender(
      <GoalBanner
        count={5}
        action={action}
        reachedAction={<button type="button">Keep going</button>}
      />,
    );

    const banner = screen.getByRole('region', { name: 'You hit your goal' });
    expect(banner).toHaveTextContent('5 out of 5');
    expect(within(banner).getByRole('button', { name: 'Keep going' })).toBeInTheDocument();
  });
});
