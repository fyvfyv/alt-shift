// Records a real Variant transcript as a mock fixture: raw SSE bytes plus the text they decode to.
// Usage: pnpm record:fixture <short|medium|long>   (reads GENERATION_API_TOKEN from .env.local)

import { writeFile } from 'node:fs/promises';
import { buildPrompt } from '../server/prompt.js';
import { DEFAULT_API_URL } from '../server/providers/variant.js';
import type { GenerateRequest } from '../shared/generation.js';

const API_URL = process.env.GENERATION_API_URL ?? DEFAULT_API_URL;

// `details` lengths (~80 / ~400 / ~1000 chars) land in the mock's short / medium / long buckets.
const SAMPLES: Record<string, GenerateRequest> = {
  short: {
    jobTitle: 'Frontend Engineer',
    company: 'Northwind',
    skills: 'React, TypeScript, accessibility',
    details: 'Four years building design systems; I care about fast, accessible interfaces.',
  },
  medium: {
    jobTitle: 'Product Designer',
    company: 'Lumen Health',
    skills: 'Figma, user research, prototyping, design systems',
    details:
      'For the past five years I have designed patient-facing products at a telehealth startup. ' +
      'I led the redesign of our appointment booking flow, which cut drop-off by a third, and ' +
      'set up a component library shared by three product teams. I run weekly usability ' +
      'sessions with patients and clinicians and turn the findings into prioritised backlogs. ' +
      'I am looking for a team where research shapes the roadmap.',
  },
  long: {
    jobTitle: 'Senior Backend Engineer',
    company: 'Harbor Logistics',
    skills: 'Go, PostgreSQL, Kafka, distributed systems, observability',
    details:
      'I have spent eight years building backend systems for marketplaces and logistics. At my ' +
      'current company I own the shipment tracking platform: a set of Go services that ingest ' +
      'carrier events through Kafka, reconcile them against PostgreSQL, and expose a real-time ' +
      'API used by forty thousand merchants. I led the migration from a monolith to event-driven ' +
      'services without downtime, introduced idempotent consumers after a painful incident with ' +
      'duplicated deliveries, and cut p99 latency of the tracking API from 900 to 120 ' +
      'milliseconds. I set up our tracing and SLO dashboards and run the on-call rotation for ' +
      'six engineers. Outside of delivery work I mentor two mid-level engineers, write most of ' +
      'our architecture decision records, and interview for the platform team. I enjoy hard ' +
      'correctness problems, clear written communication, and teams that treat operations as ' +
      'part of the product. I would like to bring that experience to routing and warehouse ' +
      'systems at a larger scale.',
  },
};

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

async function record(name: string): Promise<void> {
  const sample = SAMPLES[name];
  if (!sample) {
    throw new Error(`Unknown fixture "${name}". Expected: ${Object.keys(SAMPLES).join(', ')}`);
  }
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
