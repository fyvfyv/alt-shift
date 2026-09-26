import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDraft } from './useDraft';

const KEY = 'alt-shift.draft';
const fields = { jobTitle: 'Designer', company: 'Apple', skills: 'Figma', details: 'Ten years' };

describe('useDraft', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
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
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const { result } = renderHook(() => useDraft());

    act(() => result.current.update({ jobTitle: 'Designer' }));

    expect(result.current.draft.jobTitle).toBe('Designer');
  });
});
