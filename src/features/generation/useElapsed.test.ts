import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useElapsed } from './useElapsed';

describe('useElapsed', () => {
  afterEach(() => vi.useRealTimers());

  it('counts whole seconds while active and restarts from 0 on the next activation', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ active }) => useElapsed(active), {
      initialProps: { active: true },
    });
    expect(result.current).toBe(0);

    act(() => vi.advanceTimersByTime(2_500));
    expect(result.current).toBe(2);

    rerender({ active: false });
    expect(result.current).toBe(0);

    rerender({ active: true });
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(1);
  });
});
