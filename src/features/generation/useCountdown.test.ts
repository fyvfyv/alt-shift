import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  afterEach(() => vi.useRealTimers());

  it('counts whole seconds down to zero', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown(3, 'first'));
    expect(result.current).toBe(3);

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(2);

    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current).toBe(0);
  });

  it('restarts for a new key even when the seconds are the same', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ key }) => useCountdown(3, key), {
      initialProps: { key: {} },
    });
    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current).toBe(1);

    rerender({ key: {} });
    expect(result.current).toBe(3);

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(2);
  });
});
