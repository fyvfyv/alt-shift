type StoredFieldsOptions<Name extends string> = {
  // A getter: reading `localStorage` itself throws when the browser blocks storage.
  storage: () => Storage;
  key: string;
  names: readonly Name[];
};

// A flat record of text fields in Web Storage. Storage is a convenience here, so a browser that
// refuses it just reads empty fields and keeps nothing.
export class StoredFields<Name extends string> {
  readonly #storage: () => Storage;
  readonly #key: string;
  readonly #names: readonly Name[];

  constructor({ storage, key, names }: StoredFieldsOptions<Name>) {
    this.#storage = storage;
    this.#key = key;
    this.#names = names;
  }

  read(): Record<Name, string> {
    let record: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(this.#storage().getItem(this.#key) ?? 'null');
      if (typeof parsed === 'object' && parsed !== null) record = parsed as Record<string, unknown>;
    } catch {}
    return Object.fromEntries(
      this.#names.map((name) => [name, typeof record[name] === 'string' ? record[name] : '']),
    ) as Record<Name, string>;
  }

  // All fields empty removes the record.
  write(fields: Partial<Record<Name, string>>): void {
    try {
      if (Object.values(fields).every((value) => value === '')) this.clear();
      else this.#storage().setItem(this.#key, JSON.stringify(fields));
    } catch {}
  }

  // A `storage` event from another tab that touched this record; key null means all was cleared.
  changedBy({ key }: StorageEvent): boolean {
    return key === this.#key || key === null;
  }

  clear(): void {
    try {
      this.#storage().removeItem(this.#key);
    } catch {}
  }
}
