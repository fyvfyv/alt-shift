import { writeFile } from 'node:fs/promises';
import { decodeTranscript } from '@alt-shift/shared/variantDecoder';
import { buildPrompt } from '../src/prompt.js';
import { variantProvider } from '../src/providers/variant.js';
import { type FixtureName, SAMPLES } from '../src/samples.js';

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
  // The mock swaps these verbatim, so a letter that paraphrases one can't be personalized.
  for (const value of [sample.jobTitle, sample.company]) {
    if (!text.includes(value)) {
      throw new Error(`The letter never says "${value}" verbatim; record again.\n\n${text}`);
    }
  }

  const dir = new URL('../fixtures/', import.meta.url);
  await writeFile(new URL(`${name}.sse`, dir), raw);
  await writeFile(
    new URL(`${name}.expected.json`, dir),
    `${JSON.stringify({ deltaCount: deltas.length, text }, null, 2)}\n`,
  );
  console.log(`Recorded ${name}: ${raw.length} bytes, ${deltas.length} deltas`);
}

await record(process.argv[2] ?? '');
