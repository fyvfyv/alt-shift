import { type LetterRepository, StorageError } from './repository';
import type { Letter } from './types';

const KEY = 'alt-shift.letters';
const VERSION = 1;

type Options = { storage?: Storage; target?: EventTarget };

function isLetter(value: unknown): value is Letter {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<keyof Letter, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.createdAt === 'number' &&
    Number.isFinite(v.createdAt) &&
    typeof v.jobTitle === 'string' &&
    typeof v.company === 'string' &&
    typeof v.text === 'string'
  );
}

export class LocalStorageLetterRepository implements LetterRepository {
  readonly #storage: Storage | undefined;
  readonly #target: EventTarget;

  // `storage` is resolved lazily: touching `localStorage` itself throws when the browser blocks it.
  constructor({ storage, target = window }: Options = {}) {
    this.#storage = storage;
    this.#target = target;
  }

  async list(): Promise<Letter[]> {
    return this.#read().letters;
  }

  async save(letter: Letter): Promise<void> {
    const letters = this.#readForWrite();
    const index = letters.findIndex((l) => l.id === letter.id);
    if (index === -1) letters.push(letter);
    else letters[index] = letter;
    this.#write(letters);
  }

  async remove(id: string): Promise<void> {
    const letters = this.#readForWrite();
    const kept = letters.filter((l) => l.id !== id);
    if (kept.length !== letters.length) this.#write(kept);
  }

  subscribe(onChange: () => void): () => void {
    // `key === null` means another tab cleared the whole storage.
    const handler = (e: Event) => {
      const { key } = e as StorageEvent;
      if (key === KEY || key === null) onChange();
    };
    this.#target.addEventListener('storage', handler);
    return () => this.#target.removeEventListener('storage', handler);
  }

  #storageArea(): Storage {
    return this.#storage ?? globalThis.localStorage;
  }

  // Never overwrite a newer version's payload: an old tab open after a deploy would destroy it.
  #readForWrite(): Letter[] {
    const { letters, newer } = this.#read();
    if (newer) throw new StorageError('unavailable');
    return letters;
  }

  #read(): { letters: Letter[]; newer: boolean } {
    const none = { letters: [], newer: false };
    try {
      const raw = this.#storageArea().getItem(KEY);
      if (raw === null) return none;
      const envelope: unknown = JSON.parse(raw);
      if (typeof envelope !== 'object' || envelope === null) return none;
      const { version, letters } = envelope as { version?: unknown; letters?: unknown };
      if (typeof version === 'number' && version > VERSION) return { letters: [], newer: true };
      if (version !== VERSION || !Array.isArray(letters)) return none;
      return { letters: letters.filter(isLetter), newer: false };
    } catch {
      return none;
    }
  }

  #write(letters: Letter[]): void {
    try {
      this.#storageArea().setItem(KEY, JSON.stringify({ version: VERSION, letters }));
    } catch (e) {
      const quota = e instanceof DOMException && e.name === 'QuotaExceededError';
      throw new StorageError(quota ? 'quota' : 'unavailable', { cause: e });
    }
  }
}
