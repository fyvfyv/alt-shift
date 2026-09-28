import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  afterEach(() => vi.useRealTimers());

  it('counts whole seconds down to the deadline', () => {
    vi.useFakeTimers();
    const until = Date.now() + 3_000;
    const { result } = renderHook(() => useCountdown(until));
    expect(result.current).toBe(3);

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(2);

    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current).toBe(0);
  });

  it('shows what is left of a wait that started before it mounted', () => {
    vi.useFakeTimers();
    const until = Date.now() + 30_000;
    act(() => vi.advanceTimersByTime(20_000));

    const { result } = renderHook(() => useCountdown(until));

    expect(result.current).toBe(10);
  });
});
