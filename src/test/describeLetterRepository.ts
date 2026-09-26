import { describe, expect, it } from 'vitest';
import { createLetter } from '../features/letters/model';
import type { LetterRepository } from '../features/letters/repository';

// The behaviour every LetterRepository implementation must share.
export function describeLetterRepository(name: string, makeRepo: () => LetterRepository) {
  describe(`${name} (LetterRepository contract)`, () => {
    const letter = createLetter({ jobTitle: 'Designer', company: 'Apple', text: 'Dear Apple' });

    it('lists nothing initially', async () => {
      expect(await makeRepo().list()).toEqual([]);
    });

    it('lists a saved letter', async () => {
      const repo = makeRepo();
      await repo.save(letter);

      expect(await repo.list()).toEqual([letter]);
    });

    it('replaces a letter saved again with the same id', async () => {
      const repo = makeRepo();
      await repo.save(letter);
      await repo.save({ ...letter, text: 'Dear Apple team' });

      expect(await repo.list()).toEqual([{ ...letter, text: 'Dear Apple team' }]);
    });

    it('ignores removing an unknown id', async () => {
      const repo = makeRepo();
      await repo.save(letter);
      await repo.remove('unknown');

      expect(await repo.list()).toEqual([letter]);
    });

    it('removes an existing letter', async () => {
      const repo = makeRepo();
      await repo.save(letter);
      await repo.remove(letter.id);

      expect(await repo.list()).toEqual([]);
    });
  });
}
