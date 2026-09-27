import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Letter } from '../../features/letters/model';
import { LetterCard } from './LetterCard';

const PREVIEW_HEIGHT = 152;

function letterOf(text: string): Letter {
  return { id: 'letter', createdAt: 1_000, jobTitle: 'Role', company: 'Acme', text };
}

describe('LetterCard', () => {
  // jsdom lays nothing out: text length stands in for the body's scroll height, so a letter
  // longer than the preview overflows it and a short one fits.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
      return this.textContent?.length ?? 0;
    });
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(PREVIEW_HEIGHT);
  });

  afterEach(() => vi.restoreAllMocks());

  it('expands a clipped letter in place and collapses it again', async () => {
    const user = userEvent.setup();
    const text = `Dear Acme team,\n\n${'A sentence about impact. '.repeat(12)}`;
    render(<LetterCard letter={letterOf(text)} onDelete={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'Read more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const body = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(body).toHaveTextContent('Dear Acme team,');

    await user.click(toggle);

    const collapse = screen.getByRole('button', { name: 'Show less' });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');

    await user.click(collapse);

    expect(screen.getByRole('button', { name: 'Read more' })).toBeInTheDocument();
  });

  it('offers nothing more to read when the letter fits the preview', () => {
    render(<LetterCard letter={letterOf('Dear Acme team,\n\nShort.')} onDelete={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Read more' })).not.toBeInTheDocument();
  });
});
