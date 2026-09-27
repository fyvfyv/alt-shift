import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Letter } from '../../features/letters/model';
import { LetterCard } from './LetterCard';

const PREVIEW_HEIGHT = 152;
const PARAGRAPH = 'A sentence about impact. '.repeat(12).trim();
const LONG = `Dear Acme team,\n\n${PARAGRAPH}`;

function letterOf(text: string): Letter {
  return { id: 'letter', createdAt: 1_000, jobTitle: 'Role', company: 'Acme', text };
}

describe('LetterCard', () => {
  // jsdom lays nothing out: text length stands in for the body's scroll height, so a letter
  // longer than the preview overflows it and a short one fits. A resize is the preview height
  // changing and the observer firing.
  let previewHeight = PREVIEW_HEIGHT;
  let resize = () => {};

  beforeEach(() => {
    previewHeight = PREVIEW_HEIGHT;
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
      return this.textContent?.length ?? 0;
    });
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => previewHeight);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {
          resize = () => {};
        }
      },
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it('opens a clipped letter whole in a dialog, and hands focus back to Read more on Close', async () => {
    const user = userEvent.setup();
    render(<LetterCard letter={letterOf(LONG)} onDelete={() => {}} />);
    const readMore = screen.getByRole('button', { name: 'Read more' });

    await user.click(readMore);

    const reader = screen.getByRole('dialog', { name: 'Role, Acme' });
    expect(within(reader).getByText(PARAGRAPH)).toBeInTheDocument();
    expect(within(reader).getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();

    await user.click(within(reader).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(readMore).toHaveFocus();
  });

  it('offers nothing more to read when the letter fits the preview', () => {
    render(<LetterCard letter={letterOf('Dear Acme team,\n\nShort.')} onDelete={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Read more' })).not.toBeInTheDocument();
  });

  it('offers Read more once a narrower card starts clipping the letter', () => {
    previewHeight = 1_000;
    render(<LetterCard letter={letterOf(LONG)} onDelete={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Read more' })).not.toBeInTheDocument();

    previewHeight = PREVIEW_HEIGHT;
    act(() => resize());

    expect(screen.getByRole('button', { name: 'Read more' })).toBeInTheDocument();
  });
});
