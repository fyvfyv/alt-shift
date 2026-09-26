// Offline stand-in for the Variant API: replays transcripts recorded from the real API
// (`pnpm record:fixture`) at a realistic pace, plus the failure modes the UI has to handle.

import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { countChars } from '../../shared/generation.js';
import { jsonError } from '../jsonError.js';
import type { Provider } from './types.js';

const DISCONNECT_AT = 0.4;

function fixtureFor(details: string): 'short' | 'medium' | 'long' {
  const length = countChars(details);
  if (length < 200) return 'short';
  if (length < 600) return 'medium';
  return 'long';
}

function streamFixture(
  raw: string,
  { signal, disconnect }: { signal: AbortSignal; disconnect: boolean },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const blocks = raw.split('\n\n').filter(Boolean);
  const comments = blocks.filter((block) => block.startsWith(':'));
  const events = blocks.filter((block) => !block.startsWith(':'));
  const cutAt = disconnect ? Math.floor(events.length * DISCONNECT_AT) : events.length;
  const firstDelay = Number(process.env.MOCK_FIRST_DELTA_MS ?? 1200);
  const delay = Number(process.env.MOCK_DELAY_MS ?? 40);
  let index = 0;

  return new ReadableStream({
    start(controller) {
      for (const comment of comments) controller.enqueue(encoder.encode(`${comment}\n\n`));
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
      controller.enqueue(encoder.encode(`${events[index++]}\n\n`));
      if (index === events.length) controller.close();
    },
  });
}

export const mockProvider: Provider = async (_input, { signal, details, mockScenario }) => {
  const scenario = mockScenario ?? 'complete';
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
      const url = new URL(`../fixtures/${fixtureFor(details)}.sse`, import.meta.url);
      const raw = await readFile(url, 'utf8');
      const body = streamFixture(raw, { signal, disconnect: scenario === 'disconnect' });
      return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    }
    default:
      return jsonError(400, 'invalid_request', `Unknown mock scenario "${scenario}".`);
  }
};
