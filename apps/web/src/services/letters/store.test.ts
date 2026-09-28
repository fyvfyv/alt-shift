import { describe, expect, it } from 'vitest';
import { createFakeStorage } from '@test/fakeStorage';
import { InMemoryLetterRepository } from './inMemoryRepository';
import { LocalStorageLetterRepository } from './localStorageRepository';
import { StorageError } from './repository';
import { loadLetterStore } from './store';
import type { Letter } from './types';

function letterAt(createdAt: number, id = `letter-${createdAt}`): Letter {
  return { id, createdAt, jobTitle: 'Designer', company: 'Apple', text: 'Dear Apple' };
}

describe('loadLetterStore', () => {
  it('re-adding a letter with the same id replaces it in place, keeping its createdAt', async () => {
    const repository = new InMemoryLetterRepository();
    const store = await loadLetterStore(repository);
    await store.getState().add(letterAt(1, 'first'));
    await store.getState().add(letterAt(2, 'second'));

    await store.getState().add({ ...letterAt(3, 'first'), text: 'Dear Apple team' });

    const replaced = { ...letterAt(1, 'first'), text: 'Dear Apple team' };
    expect(store.getState().letters).toEqual([letterAt(2, 'second'), replaced]);
    expect(await repository.list()).toContainEqual(replaced);
  });

  it('keeps an added letter in memory when persisting fails', async () => {
    const repository = new InMemoryLetterRepository();
    const error = new StorageError('quota');
    repository.rejectWritesWith(error);
    const store = await loadLetterStore(repository);

    await store.getState().add(letterAt(1));

    expect(store.getState().letters).toEqual([letterAt(1)]);
    expect(store.getState().lastStorageError).toBe(error);
  });

  it('re-lists when another tab changes the letters', async () => {
    const target = new EventTarget();
    const repository = new LocalStorageLetterRepository({ storage: createFakeStorage(), target });
    const store = await loadLetterStore(repository);

    await repository.save(letterAt(1));
    target.dispatchEvent(new StorageEvent('storage', { key: 'alt-shift.letters' }));

    await expect.poll(() => store.getState().letters).toEqual([letterAt(1)]);
  });
});
