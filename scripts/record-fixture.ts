// Records a real Variant transcript as a mock fixture: raw SSE bytes plus the text they decode to.
// Usage: pnpm record:fixture <short|medium|long>   (reads GENERATION_API_TOKEN from .env.local)

import { writeFile } from 'node:fs/promises';
import { type FixtureName, SAMPLES } from '../server/fixtures/samples.js';
import { buildPrompt } from '../server/prompt.js';
import { DEFAULT_API_URL } from '../server/providers/variant.js';

const API_URL = process.env.GENERATION_API_URL ?? DEFAULT_API_URL;

function decode(raw: string): { deltaCount: number; text: string } {
  let deltaCount = 0;
  let text = '';
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') break;
    deltaCount++;
    text += (JSON.parse(data) as { text: string }).text;
  }
  return { deltaCount, text };
}

function isFixtureName(name: string): name is FixtureName {
  return Object.hasOwn(SAMPLES, name);
}

async function record(name: string): Promise<void> {
  if (!isFixtureName(name)) {
    throw new Error(`Unknown fixture "${name}". Expected: ${Object.keys(SAMPLES).join(', ')}`);
  }
  const sample = SAMPLES[name];
  const token = process.env.GENERATION_API_TOKEN;
  if (!token) throw new Error('GENERATION_API_TOKEN is not set (see .env.example).');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPrompt(sample)),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Upstream responded ${response.status}: ${raw}`);

  const dir = new URL('../server/fixtures/', import.meta.url);
  await writeFile(new URL(`${name}.sse`, dir), raw);
  await writeFile(
    new URL(`${name}.expected.json`, dir),
    `${JSON.stringify(decode(raw), null, 2)}\n`,
  );
  console.log(`Recorded ${name}: ${raw.length} bytes`);
}

await record(process.argv[2] ?? '');
