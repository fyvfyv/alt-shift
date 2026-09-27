import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { countChars, type GenerateRequest } from '../../shared/generation.js';
import {
  DONE_EVENT,
  decodeTranscript,
  encodeDelta,
  KEEPALIVE_COMMENT,
} from '../../shared/variantDecoder.js';
import { type FixtureName, SAMPLES } from '../fixtures/samples.js';
import { jsonError } from '../jsonError.js';
import type { Provider } from './types.js';

// The live API now and then closes cleanly mid-letter, without [DONE]; `truncate` mimics that.
const CUT_AT = 0.4;
// The client takes a letter ending on a full sentence as whole, so never cut right after one.
const SENTENCE_END = /[.!?…]\s*$/;

type Scenario = 'complete' | 'disconnect' | 'truncate';

function fixtureFor(details: string): FixtureName {
  const length = countChars(details);
  if (length < 200) return 'short';
  if (length < 600) return 'medium';
  return 'long';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// One pass over both names, so a replacement value is never itself replaced.
function personalize(text: string, recorded: GenerateRequest, request: GenerateRequest): string {
  const swaps = new Map([
    [recorded.jobTitle, request.jobTitle],
    [recorded.company, request.company],
  ]);
  const pattern = new RegExp([...swaps.keys()].map(escapeRegExp).join('|'), 'g');
  return text.replace(pattern, (match) => swaps.get(match) ?? match);
}

// Code points, not UTF-16 units, so a surrogate pair never straddles two deltas.
function rechunk(text: string, sizes: number[]): string[] {
  const chars = Array.from(text);
  const chunks: string[] = [];
  for (let offset = 0, i = 0; offset < chars.length; i++) {
    const size = Math.max(1, sizes[i % sizes.length] ?? 1);
    chunks.push(chars.slice(offset, offset + size).join(''));
    offset += size;
  }
  return chunks;
}

async function deltasFor(request: GenerateRequest): Promise<string[]> {
  const name = fixtureFor(request.details);
  const raw = await readFile(new URL(`../fixtures/${name}.sse`, import.meta.url), 'utf8');
  const deltas = decodeTranscript(raw);
  const text = personalize(deltas.join(''), SAMPLES[name], request);
  return rechunk(text, deltas.map(countChars));
}

function cutIndex(deltas: string[]): number {
  let index = Math.floor(deltas.length * CUT_AT);
  while (index < deltas.length - 1 && SENTENCE_END.test(deltas.slice(0, index).join(''))) index++;
  return index;
}

function stream(
  deltas: string[],
  { signal, scenario }: { signal: AbortSignal; scenario: Scenario },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const events = [...deltas.map(encodeDelta), DONE_EVENT];
  const cutAt = scenario === 'complete' ? events.length : cutIndex(deltas);
  const firstDelay = Number(process.env.MOCK_FIRST_DELTA_MS ?? 1200);
  const delay = Number(process.env.MOCK_DELAY_MS ?? 40);
  let index = 0;

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(KEEPALIVE_COMMENT));
    },
    async pull(controller) {
      try {
        await sleep(index === 0 ? firstDelay : delay, undefined, { signal });
      } catch {
        controller.error(signal.reason);
        return;
      }
      if (index === cutAt) {
        if (scenario === 'disconnect') controller.error(new Error('Mock disconnect'));
        else controller.close();
        return;
      }
      controller.enqueue(encoder.encode(events[index++]));
      if (index === events.length) controller.close();
    },
  });
}

export const mockProvider: Provider = async (_input, { signal, request, headers }) => {
  const scenario = headers.get('x-mock-scenario') ?? 'complete';
  switch (scenario) {
    case 'rate-limit':
      return jsonError(429, 'rate_limit_exceeded', 'Rate limit exceeded (mock).', {
        'Retry-After': '3',
      });
    case 'upstream-error':
      return jsonError(502, 'upstream_error', 'Upstream failure (mock).');
    case 'invalid-token':
      return jsonError(401, 'invalid_token', 'Invalid token (mock).');
    case 'complete':
    case 'disconnect':
    case 'truncate': {
      const body = stream(await deltasFor(request), { signal, scenario });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    }
    default:
      return jsonError(400, 'invalid_request', `Unknown mock scenario "${scenario}".`);
  }
};
