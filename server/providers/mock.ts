// Offline stand-in for the Variant API: replays transcripts recorded from the real API
// (`pnpm record:fixture`) at a realistic pace, plus the failure modes the UI has to handle.
// The recorded job title and company are swapped for the request's so the letter reads as the
// user's own; the text is then re-chunked to the recorded delta sizes so pacing stays realistic.

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

const DISCONNECT_AT = 0.4;

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

async function eventsFor(request: GenerateRequest): Promise<string[]> {
  const name = fixtureFor(request.details);
  const raw = await readFile(new URL(`../fixtures/${name}.sse`, import.meta.url), 'utf8');
  const deltas = decodeTranscript(raw);
  const text = personalize(deltas.join(''), SAMPLES[name], request);
  return [...rechunk(text, deltas.map(countChars)).map(encodeDelta), DONE_EVENT];
}

function stream(
  events: string[],
  { signal, disconnect }: { signal: AbortSignal; disconnect: boolean },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const cutAt = disconnect ? Math.floor(events.length * DISCONNECT_AT) : events.length;
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
        controller.error(new Error('Mock disconnect'));
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
    case 'disconnect': {
      const events = await eventsFor(request);
      const body = stream(events, { signal, disconnect: scenario === 'disconnect' });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    }
    default:
      return jsonError(400, 'invalid_request', `Unknown mock scenario "${scenario}".`);
  }
};
