import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDraft } from './useDraft';

const KEY = 'alt-shift.draft';
const fields = { jobTitle: 'Designer', company: 'Apple', skills: 'Figma', details: 'Ten years' };

describe('useDraft', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('restores the fields after a remount once the debounce has passed', () => {
    vi.useFakeTimers();
    const first = renderHook(() => useDraft());
    act(() => first.result.current.update(fields));
    act(() => vi.advanceTimersByTime(150));
    first.unmount();

    const second = renderHook(() => useDraft());

    expect(second.result.current.draft).toEqual(fields);
  });

  it('clear removes the stored draft but keeps the values in memory', () => {
    sessionStorage.setItem(KEY, JSON.stringify(fields));
    const { result } = renderHook(() => useDraft());

    act(() => result.current.clear());

    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(result.current.draft).toEqual(fields);
  });

  it('starts empty from a malformed draft', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ jobTitle: 42 }));

    const { result } = renderHook(() => useDraft());

    expect(result.current.draft).toEqual({ jobTitle: '', company: '', skills: '', details: '' });
  });

  it('keeps working when sessionStorage throws', () => {
    vi.useFakeTimers();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const { result } = renderHook(() => useDraft());

    act(() => result.current.update({ jobTitle: 'Designer' }));
    act(() => vi.advanceTimersByTime(150));

    expect(result.current.draft.jobTitle).toBe('Designer');
  });
});
