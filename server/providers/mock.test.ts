import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerateRequest } from '../../shared/generation';
import { DONE_EVENT, decodeTranscript } from '../../shared/variantDecoder';
import { type FixtureName, SAMPLES } from '../fixtures/samples';
import { mockProvider } from './mock';

const input = { system: '', prompt: '', maxTokens: 900 };

async function expected(name: FixtureName): Promise<{ deltaCount: number; text: string }> {
  const url = new URL(`../fixtures/${name}.expected.json`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

function call(request: GenerateRequest, scenario?: string, signal = new AbortController().signal) {
  const headers = new Headers(scenario ? { 'x-mock-scenario': scenario } : {});
  return mockProvider(input, { signal, request, headers });
}

async function start(request: GenerateRequest, scenario?: string, signal?: AbortSignal) {
  const response = await call(request, scenario, signal);
  if (!response.body) throw new Error('expected a streaming body');
  return response.body.pipeThrough(new TextDecoderStream()).getReader();
}

async function readAll(reader: ReadableStreamDefaultReader<string>): Promise<string[]> {
  const chunks: string[] = [];
  for (let result = await reader.read(); !result.done; result = await reader.read()) {
    chunks.push(result.value);
  }
  return chunks;
}

async function deltasFor(request: GenerateRequest): Promise<string[]> {
  return decodeTranscript((await readAll(await start(request))).join(''));
}

function occurrences(text: string, value: string): number {
  return text.split(value).length - 1;
}

describe('mockProvider', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_FIRST_DELTA_MS', '0');
    vi.stubEnv('MOCK_DELAY_MS', '0');
  });

  it.each([
    [199, 'short'],
    [200, 'medium'],
    [599, 'medium'],
    [600, 'long'],
  ] as const)(
    'replays %i characters of details as the %s transcript, delta for delta',
    async (length, name) => {
      const deltas = await deltasFor({ ...SAMPLES[name], details: 'a'.repeat(length) });

      const fixture = await expected(name);
      expect(deltas).toHaveLength(fixture.deltaCount);
      expect(deltas.join('')).toBe(fixture.text);
    },
  );

  it.each(['short', 'medium', 'long'] as const)(
    'writes the request job title and company over every mention in the %s transcript',
    async (name) => {
      const chunks = await readAll(
        await start({ ...SAMPLES[name], jobTitle: 'QA Lead', company: 'Acme' }),
      );
      const text = decodeTranscript(chunks.join('')).join('').toLowerCase();

      expect(text).toContain('dear acme team,');
      expect(text).toContain('qa lead');
      expect(text).not.toContain(SAMPLES[name].company.toLowerCase());
      expect(text).not.toContain(SAMPLES[name].jobTitle.toLowerCase());
      expect(chunks[0]).toBe(': keepalive\n\n');
      expect(chunks.at(-1)).toBe('data: [DONE]\n\n');
    },
  );

  it('swaps the two names in one pass, so a replacement is never replaced again', async () => {
    const { jobTitle, company } = SAMPLES.short;
    const recorded = (await expected('short')).text;

    const text = (await deltasFor({ ...SAMPLES.short, jobTitle: company, company: jobTitle })).join(
      '',
    );

    expect(text).toContain(`Dear ${jobTitle} team,`);
    expect(occurrences(text, jobTitle)).toBe(occurrences(recorded, company));
    expect(occurrences(text, company)).toBe(occurrences(recorded, jobTitle));
  });

  it('keeps replacement patterns in a request value literal', async () => {
    const text = (await deltasFor({ ...SAMPLES.short, company: 'Acme $& Co' })).join('');

    expect(text).toContain('Dear Acme $& Co team,');
  });

  it('never splits an emoji across two deltas', async () => {
    const deltas = await deltasFor({ ...SAMPLES.short, company: '🚀🚀🚀 Labs' });

    expect(deltas.join('')).toContain('Dear 🚀🚀🚀 Labs team,');
    expect(deltas.filter((delta) => /\p{Surrogate}/u.test(delta))).toEqual([]);
  });

  it('errors the stream part-way through on the disconnect scenario', async () => {
    const reader = await start(SAMPLES.short, 'disconnect');
    let deltas = 0;

    await expect(
      (async () => {
        for (;;) {
          const { value = '' } = await reader.read();
          deltas += decodeTranscript(value).length;
        }
      })(),
    ).rejects.toThrow('Mock disconnect');

    const { deltaCount } = await expected('short');
    expect(deltas).toBeGreaterThan(0);
    expect(deltas).toBeLessThan(deltaCount);
  });

  // The client takes a letter that stops on a finished sentence as whole; at 40% the medium
  // recording happens to end one.
  it.each(['short', 'medium', 'long'] as const)(
    'closes the %s letter cleanly mid-sentence, without [DONE], on the truncate scenario',
    async (name) => {
      const sse = (await readAll(await start(SAMPLES[name], 'truncate'))).join('');

      const deltas = decodeTranscript(sse);
      expect(deltas.length).toBeGreaterThan(0);
      expect(deltas.length).toBeLessThan((await expected(name)).deltaCount);
      expect(sse).not.toContain(DONE_EVENT);
      expect(deltas.join('').trimEnd()).not.toMatch(/[.!?…]$/);
    },
  );

  it('answers the rate-limit scenario with 429 and a Retry-After', async () => {
    const response = await call(SAMPLES.short, 'rate-limit');

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('3');
  });

  it('rejects an unknown scenario with 400 invalid_request', async () => {
    const response = await call(SAMPLES.short, 'bogus');

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'invalid_request' } });
  });

  it('rejects the next read with AbortError once the signal aborts', async () => {
    const controller = new AbortController();
    const reader = await start(SAMPLES.short, undefined, controller.signal);
    expect((await reader.read()).value).toBe(': keepalive\n\n');

    controller.abort();

    await expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
