import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_REQUEST, type GenerateRequest } from '../../../shared/generation';
import { useGeneratorFields } from './useGeneratorFields';

const DRAFT_KEY = 'alt-shift.draft';
const PROFILE_KEY = 'alt-shift.profile';
const job = { jobTitle: 'Designer', company: 'Apple' };
const skills = { skills: 'Figma', details: 'Ten years' };
const fields = { ...job, ...skills };

describe('useGeneratorFields', () => {
  afterEach(() => vi.restoreAllMocks());

  it('restores the job from sessionStorage and the profile from localStorage after a remount', () => {
    const first = renderHook(() => useGeneratorFields());
    act(() => first.result.current.update(fields));
    act(() => first.result.current.setName('Oleg'));
    first.unmount();

    const second = renderHook(() => useGeneratorFields());

    expect(second.result.current.values).toEqual(fields);
    expect(second.result.current.profile.name).toBe('Oleg');
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null')).toEqual(job);
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')).toEqual({
      ...skills,
      name: 'Oleg',
    });
  });

  it('resetJob clears the job fields and keeps the profile', () => {
    const { result } = renderHook(() => useGeneratorFields());
    act(() => result.current.update(fields));

    act(() => result.current.resetJob());

    expect(result.current.values).toEqual({ ...EMPTY_REQUEST, ...skills });
  });

  it('forgetJob removes the stored job but keeps the profile and the values in memory', () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(job));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(skills));
    const { result } = renderHook(() => useGeneratorFields());

    act(() => result.current.forgetJob());

    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(localStorage.getItem(PROFILE_KEY)).not.toBeNull();
    expect(result.current.values).toEqual(fields);
  });

  it('saves the forgotten job again when only a profile field is edited', () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(job));
    const first = renderHook(() => useGeneratorFields());
    act(() => first.result.current.forgetJob());

    act(() => first.result.current.update({ details: 'Now at Apple' }));
    first.unmount();

    const second = renderHook(() => useGeneratorFields());
    expect(second.result.current.values).toEqual({ ...job, skills: '', details: 'Now at Apple' });
  });

  it('shows a prefill on the first render: the job replaces the draft, the profile fills only empty fields', () => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ jobTitle: 'iOS Engineer', company: 'Meta' }),
    );
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ skills: 'Figma' }));
    const prefill = {
      jobTitle: 'Designer',
      company: 'Apple',
      skills: 'Sketch',
      details: 'Ten years',
    };
    const renders: GenerateRequest[] = [];

    const { result } = renderHook(() => {
      const hook = useGeneratorFields({ prefill });
      renders.push(hook.values);
      return hook;
    });
    act(() => result.current.setName('Oleg'));

    expect(renders[0]).toEqual({ ...job, skills: 'Figma', details: 'Ten years' });
    // The tab's draft keeps only the part of the hand-over on screen.
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null')).toEqual({
      ...job,
      details: 'Ten years',
    });
    // The handed-over bio is shown, never saved to the profile, even when the profile is.
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')).toEqual({
      skills: 'Figma',
      details: '',
      name: 'Oleg',
    });
  });

  it('shows the whole handed-over example again after a reload, still not in the profile', () => {
    const first = renderHook(() => useGeneratorFields({ prefill: fields }));
    first.unmount();

    const second = renderHook(() => useGeneratorFields());

    expect(second.result.current.values).toEqual(fields);
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
  });

  it('resetJob drops a handed-over bio the user never edited and keeps an edited field', () => {
    const { result } = renderHook(() => useGeneratorFields({ prefill: fields }));
    act(() => result.current.update({ skills: 'Figma, Sketch' }));

    act(() => result.current.resetJob());

    expect(result.current.values).toEqual({ ...EMPTY_REQUEST, skills: 'Figma, Sketch' });
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')).toEqual({
      skills: 'Figma, Sketch',
      details: '',
      name: '',
    });
    // Nor does a reload bring the dropped bio back.
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('starts empty from corrupt JSON in either storage', () => {
    sessionStorage.setItem(DRAFT_KEY, '{"jobTitle":');
    localStorage.setItem(PROFILE_KEY, '[1,2');

    const { result } = renderHook(() => useGeneratorFields());

    expect(result.current.values).toEqual(EMPTY_REQUEST);
    expect(result.current.profile.name).toBe('');
  });

  it('keeps working when storage throws', () => {
    const denied = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);
    const { result } = renderHook(() => useGeneratorFields());

    act(() => result.current.update({ jobTitle: 'Designer', skills: 'Figma' }));

    expect(result.current.values).toMatchObject({ jobTitle: 'Designer', skills: 'Figma' });
  });
});
