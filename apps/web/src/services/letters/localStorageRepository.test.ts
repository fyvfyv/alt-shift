import { describe, expect, it, vi } from 'vitest';
import { describeLetterRepository } from '@test/describeLetterRepository';
import { createFakeStorage } from '@test/fakeStorage';
import { LocalStorageLetterRepository } from './localStorageRepository';
import { createLetter } from './model';
import { StorageError } from './repository';

const KEY = 'alt-shift.letters';

describeLetterRepository(
  'LocalStorageLetterRepository',
  () =>
    new LocalStorageLetterRepository({ storage: createFakeStorage(), target: new EventTarget() }),
);

describe('LocalStorageLetterRepository', () => {
  function setup() {
    const storage = createFakeStorage();
    const target = new EventTarget();
    return { storage, target, repo: new LocalStorageLetterRepository({ storage, target }) };
  }

  const letter = createLetter({ jobTitle: 'Designer', company: 'Apple', text: 'Dear Apple' });

  it('reads a newer envelope version as empty and never writes over it', async () => {
    const { storage, repo } = setup();
    const newer = JSON.stringify({ version: 2, letters: [letter] });
    storage.setItem(KEY, newer);
    const other = createLetter({ jobTitle: 'Engineer', company: 'Acme', text: 'Dear Acme' });

    expect(await repo.list()).toEqual([]);
    await expect(repo.save(other)).rejects.toBeInstanceOf(StorageError);
    await expect(repo.remove(letter.id)).rejects.toBeInstanceOf(StorageError);
    expect(storage.getItem(KEY)).toBe(newer);
  });

  it('drops a malformed entry and keeps the valid ones', async () => {
    const { storage, repo } = setup();
    const malformed = { ...letter, id: 'broken', createdAt: 'yesterday' };
    storage.setItem(KEY, JSON.stringify({ version: 1, letters: [malformed, letter, null] }));

    expect(await repo.list()).toEqual([letter]);
  });

  it('lists nothing when the stored value is not JSON or reading storage throws', async () => {
    const { storage, repo } = setup();
    storage.setItem(KEY, '{not json');
    expect(await repo.list()).toEqual([]);

    storage.getItem = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    expect(await repo.list()).toEqual([]);
  });

  it.each(['QuotaExceededError', 'SecurityError'])(
    'wraps a %s on write in a StorageError',
    async (name) => {
      const { storage, repo } = setup();
      storage.setItem = () => {
        throw new DOMException('write failed', name);
      };

      await expect(repo.save(letter)).rejects.toBeInstanceOf(StorageError);
    },
  );

  it.each([KEY, null])('notifies the subscriber on a storage event with key %s', (key) => {
    const { target, repo } = setup();
    const onChange = vi.fn();
    repo.subscribe(onChange);

    target.dispatchEvent(new StorageEvent('storage', { key }));

    expect(onChange).toHaveBeenCalledOnce();
  });
});
