import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useElapsed } from './useElapsed';

describe('useElapsed', () => {
  afterEach(() => vi.useRealTimers());

  it('counts whole seconds since the value last changed, and stops at undefined', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ since }) => useElapsed(since), {
      initialProps: { since: 'Dear' as string | undefined },
    });
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(2_500));
    expect(result.current).toBe(2);

    rerender({ since: 'Dear Apple' });
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(1);

    rerender({ since: undefined });
    expect(result.current).toBe(0);
  });
});
