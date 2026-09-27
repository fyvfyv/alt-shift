// Storage is a convenience: when it is unavailable or holds junk, the fields read as empty and a
// write is dropped. `storage` is a getter because touching `localStorage` itself throws when the
// browser blocks it.

export function readFields<Name extends string>(
  storage: () => Storage,
  key: string,
  names: readonly Name[],
): Record<Name, string> {
  let record: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(storage().getItem(key) ?? 'null');
    if (typeof parsed === 'object' && parsed !== null) record = parsed as Record<string, unknown>;
  } catch {}
  const fields = {} as Record<Name, string>;
  for (const name of names) {
    const value = record[name];
    fields[name] = typeof value === 'string' ? value : '';
  }
  return fields;
}

export function writeFields(storage: () => Storage, key: string, fields: Record<string, string>) {
  try {
    if (Object.values(fields).every((value) => value === '')) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(fields));
  } catch {}
}
