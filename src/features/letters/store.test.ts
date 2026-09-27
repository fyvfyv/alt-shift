import { describe, expect, it } from 'vitest';
import { createFakeStorage } from '../../test/fakeStorage';
import { InMemoryLetterRepository } from './inMemoryRepository';
import { LocalStorageLetterRepository } from './localStorageRepository';
import { createLetter, type Letter } from './model';
import { StorageError } from './repository';
import { createLetterStore } from './store';

function letterAt(createdAt: number, id = `letter-${createdAt}`): Letter {
  return { id, createdAt, jobTitle: 'Designer', company: 'Apple', text: 'Dear Apple' };
}

describe('createLetterStore', () => {
  it('hydrates newest first from an out-of-order repository', async () => {
    const repository = new InMemoryLetterRepository([letterAt(1), letterAt(3), letterAt(2)]);
    const store = createLetterStore({ repository });

    await store.getState().hydrate();

    expect(store.getState().letters.map((l) => l.createdAt)).toEqual([3, 2, 1]);
  });

  it('adds a letter on top and persists it', async () => {
    const repository = new InMemoryLetterRepository([letterAt(1)]);
    const store = createLetterStore({ repository });
    await store.getState().hydrate();
    const letter = createLetter({ jobTitle: 'Designer', company: 'Apple', text: 'Dear Apple' });

    await store.getState().add(letter);

    expect(store.getState().letters[0]).toEqual(letter);
    expect(await repository.list()).toContainEqual(letter);
  });

  it('re-adding a letter with the same id replaces it in place, keeping its createdAt', async () => {
    const repository = new InMemoryLetterRepository();
    const store = createLetterStore({ repository });
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
    const store = createLetterStore({ repository });

    await store.getState().add(letterAt(1));

    expect(store.getState().letters).toEqual([letterAt(1)]);
    expect(store.getState().lastStorageError).toBe(error);
  });

  it('removes a letter and persists the removal', async () => {
    const repository = new InMemoryLetterRepository([letterAt(1), letterAt(2)]);
    const store = createLetterStore({ repository });
    await store.getState().hydrate();

    await store.getState().remove('letter-1');

    expect(store.getState().letters).toEqual([letterAt(2)]);
    expect(await repository.list()).toEqual([letterAt(2)]);
  });

  it('re-lists when another tab changes the letters', async () => {
    const target = new EventTarget();
    const repository = new LocalStorageLetterRepository({ storage: createFakeStorage(), target });
    const store = createLetterStore({ repository });
    await store.getState().hydrate();

    await repository.save(letterAt(1));
    target.dispatchEvent(new StorageEvent('storage', { key: 'alt-shift.letters' }));

    await expect.poll(() => store.getState().letters).toEqual([letterAt(1)]);
  });
});
