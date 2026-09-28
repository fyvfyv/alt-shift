import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GoalBanner } from './GoalBanner';

describe('GoalBanner', () => {
  it.each([
    [0, 'Generate your first job application to get hired faster'],
    [4, 'One more job application and you hit your goal'],
  ])('at %i pitches the next step', (count, subtitle) => {
    render(<GoalBanner count={count} action={<button type="button">Create New</button>} />);
    expect(screen.getByText(subtitle)).toBeInTheDocument();
  });
});
