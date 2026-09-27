import { describe, expect, it } from 'vitest';
import { createLetter } from '../features/letters/model';
import type { LetterRepository } from '../features/letters/repository';

export function describeLetterRepository(name: string, makeRepo: () => LetterRepository) {
  describe(`${name} (LetterRepository contract)`, () => {
    const letter = createLetter({ jobTitle: 'Designer', company: 'Apple', text: 'Dear Apple' });

    it('replaces a letter saved again with the same id', async () => {
      const repo = makeRepo();
      await repo.save(letter);
      await repo.save({ ...letter, text: 'Dear Apple team' });

      expect(await repo.list()).toEqual([{ ...letter, text: 'Dear Apple team' }]);
    });

    it('removes an existing letter and ignores an unknown id', async () => {
      const repo = makeRepo();
      await repo.save(letter);

      await repo.remove('unknown');
      expect(await repo.list()).toEqual([letter]);

      await repo.remove(letter.id);
      expect(await repo.list()).toEqual([]);
    });
  });
}
