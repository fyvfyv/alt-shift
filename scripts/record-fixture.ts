// Records a real Variant transcript as a mock fixture: raw SSE bytes plus the text they decode to.
// Usage: pnpm record:fixture <short|medium|long>   (reads GENERATION_API_TOKEN from .env.local)

import { writeFile } from 'node:fs/promises';
import { type FixtureName, SAMPLES } from '../server/fixtures/samples.js';
import { buildPrompt } from '../server/prompt.js';
import { variantProvider } from '../server/providers/variant.js';
import { decodeTranscript } from '../shared/variantDecoder.js';

function isFixtureName(name: string): name is FixtureName {
  return Object.hasOwn(SAMPLES, name);
}

async function record(name: string): Promise<void> {
  if (!isFixtureName(name)) {
    throw new Error(`Unknown fixture "${name}". Expected: ${Object.keys(SAMPLES).join(', ')}`);
  }
  const sample = SAMPLES[name];
  if (!process.env.GENERATION_API_TOKEN) {
    throw new Error('GENERATION_API_TOKEN is not set (see .env.example).');
  }

  // The production provider, so a recording takes the same request path as a user's letter.
  const response = await variantProvider(buildPrompt(sample), {
    signal: new AbortController().signal,
    request: sample,
    headers: new Headers(),
  });
  const raw = await response.text();
  if (!response.ok) {
    const retryAfter = response.headers.get('Retry-After');
    const wait = retryAfter === null ? '' : ` (Retry-After: ${retryAfter}s)`;
    throw new Error(`Upstream responded ${response.status}${wait}: ${raw}`);
  }

  const deltas = decodeTranscript(raw);
  const text = deltas.join('');
  if (deltas.length === 0) throw new Error('The transcript has no text deltas; record again.');
  // The mock personalizes a transcript by swapping these two strings verbatim, so a letter that
  // paraphrases either one would keep the sample's name in every mock letter.
  for (const value of [sample.jobTitle, sample.company]) {
    if (!text.includes(value)) {
      throw new Error(`The letter never says "${value}" verbatim; record again.\n\n${text}`);
    }
  }

  const dir = new URL('../server/fixtures/', import.meta.url);
  await writeFile(new URL(`${name}.sse`, dir), raw);
  await writeFile(
    new URL(`${name}.expected.json`, dir),
    `${JSON.stringify({ deltaCount: deltas.length, text }, null, 2)}\n`,
  );
  console.log(`Recorded ${name}: ${raw.length} bytes, ${deltas.length} deltas`);
}

await record(process.argv[2] ?? '');
