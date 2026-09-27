import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StorageNote } from './StorageNote';

describe('StorageNote', () => {
  it('says so through a status that was there before storage failed', () => {
    const { rerender } = render(<StorageNote failed={false} />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    rerender(<StorageNote failed />);

    expect(status).toHaveTextContent(/couldn't save your latest changes/);
  });
});
