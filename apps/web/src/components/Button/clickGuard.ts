import type { MouseEventHandler } from 'react';

// preventDefault also stops a submit button from submitting its form.
export function clickUnlessLoading(
  loading: boolean,
  onClick?: MouseEventHandler<HTMLButtonElement>,
): MouseEventHandler<HTMLButtonElement> {
  return (event) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
}
