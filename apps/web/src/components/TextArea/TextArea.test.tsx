import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { TextArea } from './TextArea';

function Controlled({ limit }: { limit: number }) {
  const [value, setValue] = useState('');
  return (
    <TextArea
      label="Details"
      value={value}
      limit={limit}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe('TextArea', () => {
  it('announces the overflow once when typing crosses the limit', async () => {
    const user = userEvent.setup();
    render(<Controlled limit={3} />);
    const field = screen.getByLabelText('Details');
    const status = screen.getByRole('status');

    await user.type(field, 'abcd');
    expect(status).toHaveTextContent('1 character over the limit');

    await user.type(field, 'ef');
    expect(status).toHaveTextContent('1 character over the limit');

    await user.clear(field);
    expect(status).toBeEmptyDOMElement();
  });
});
