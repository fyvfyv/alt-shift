import { EMPTY_REQUEST } from '@alt-shift/shared/generation';
import type { GenerateRequest } from '@alt-shift/shared/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GenerationQueue } from '@services/generation/queue';
import { InMemoryLetterRepository } from '@services/letters/inMemoryRepository';
import { loadLetterStore } from '@services/letters/store';
import { createProfileStore } from '@services/profile/profileStore';
import { FakeGenerationPort } from '@test/fakeGenerationPort';
import { requestOf } from './derive';
import { GeneratorSession } from './GeneratorSession';
import type { FieldName } from './types';

const PROFILE_KEY = 'alt-shift.profile';
const bio = { skills: 'Figma', details: 'Ten years' };
const example: GenerateRequest = { jobTitle: 'Designer', company: 'Apple', ...bio };

async function openApp() {
  const letters = await loadLetterStore(new InMemoryLetterRepository());
  const fake = new FakeGenerationPort();
  const queue = new GenerationQueue({ port: fake.port, letters });

  // Each visit reads the profile afresh, as a reload does.
  function visit(prefill?: unknown) {
    const profile = createProfileStore();
    const session = new GeneratorSession({ queue, letters, profile }, prefill);
    session.connect();
    const values = () => requestOf(session.store.getState(), profile.getState());
    const type = (request: Partial<GenerateRequest>) => {
      for (const [name, value] of Object.entries(request)) session.change(name as FieldName, value);
    };
    return { session, profile, values, type };
  }

  return { visit, fake, letters };
}

describe('GeneratorSession', () => {
  afterEach(() => vi.restoreAllMocks());

  it('brings back the job typed in this tab and the profile of every tab', async () => {
    const { visit } = await openApp();
    visit().type(example);

    expect(visit().values()).toEqual(example);

    sessionStorage.clear();
    expect(visit().values()).toEqual({ ...EMPTY_REQUEST, ...bio });
  });

  it('forgets the job once its letter is written, and keeps it again after the next edit', async () => {
    const { visit, fake, letters } = await openApp();
    const first = visit();
    first.type(example);
    first.session.generate();
    fake.lastRun().emit('Dear Apple team,');
    fake.lastRun().end();
    await vi.waitFor(() => expect(letters.getState().letters).toHaveLength(1));

    expect(visit().values()).toEqual({ ...EMPTY_REQUEST, ...bio });

    first.type({ details: 'Now at Apple' });
    expect(visit().values()).toEqual({ ...example, details: 'Now at Apple' });
  });

  it('leaves out a job whose letter is still being written', async () => {
    const { visit } = await openApp();
    const first = visit();
    first.type(example);
    first.session.generate();

    expect(visit().values()).toEqual({ ...EMPTY_REQUEST, ...bio });
  });

  it('takes a handed-over job over the draft, and its example only where the profile is empty', async () => {
    const { visit } = await openApp();
    visit().type({ jobTitle: 'iOS Engineer', skills: 'Swift' });

    expect(visit({ ...example, skills: 'Sketch' }).values()).toEqual({
      ...example,
      skills: 'Swift',
    });
  });

  it('shows the handed-over example again after a reload, never keeping it in the profile', async () => {
    const { visit } = await openApp();
    visit(example).profile.getState().update({ name: 'Oleg' });

    expect(visit().values()).toEqual(example);
    expect(JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')).toEqual({
      skills: '',
      details: '',
      name: 'Oleg',
    });
  });

  it('Create New drops an example the user never edited and keeps what they typed', async () => {
    const { visit } = await openApp();
    const handed = visit(example);
    handed.type({ skills: 'Figma, Sketch' });

    handed.session.startNew();

    const cleared = { ...EMPTY_REQUEST, skills: 'Figma, Sketch' };
    expect(handed.values()).toEqual(cleared);
    expect(visit().values()).toEqual(cleared);
  });

  it('starts empty from corrupt storage and keeps working when storage throws', async () => {
    sessionStorage.setItem('alt-shift.draft', '{"jobTitle":');
    localStorage.setItem(PROFILE_KEY, '[1,2');
    const { visit } = await openApp();
    expect(visit().values()).toEqual(EMPTY_REQUEST);

    const denied = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);
    const blocked = visit();
    blocked.type({ jobTitle: 'Designer', skills: 'Figma' });

    expect(blocked.values()).toMatchObject({ jobTitle: 'Designer', skills: 'Figma' });
  });
});
