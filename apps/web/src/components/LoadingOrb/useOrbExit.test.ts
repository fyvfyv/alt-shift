import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOrbExit } from './useOrbExit';

function renderOrbExit() {
  return renderHook(({ loading }) => useOrbExit(loading), { initialProps: { loading: true } });
}

function prefersReducedMotion(reduce: boolean) {
  const matchMedia = window.matchMedia;
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...matchMedia(query),
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
  }));
}

describe('useOrbExit', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the orb for its 250 ms fade once loading ends', () => {
    prefersReducedMotion(false);
    vi.useFakeTimers();
    const { result, rerender } = renderOrbExit();
    expect(result.current).toBe(false);

    rerender({ loading: false });
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(249));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('drops the orb at once under reduced motion', () => {
    prefersReducedMotion(true);
    const { result, rerender } = renderOrbExit();

    rerender({ loading: false });

    expect(result.current).toBe(false);
  });
});
