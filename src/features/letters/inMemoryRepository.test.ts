import { describeLetterRepository } from '../../test/describeLetterRepository';
import { InMemoryLetterRepository } from './inMemoryRepository';

describeLetterRepository('InMemoryLetterRepository', () => new InMemoryLetterRepository());
