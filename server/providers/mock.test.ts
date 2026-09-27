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

async function start(request: GenerateRequest, scenario?: string) {
  const headers = new Headers(scenario ? { 'x-mock-scenario': scenario } : {});
  const response = await mockProvider(input, {
    signal: new AbortController().signal,
    request,
    headers,
  });
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

describe('mockProvider', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_FIRST_DELTA_MS', '0');
    vi.stubEnv('MOCK_DELAY_MS', '0');
  });

  it.each([
    [0, 'short'],
    [400, 'medium'],
    [1000, 'long'],
  ] as const)(
    'replays %i characters of details as the %s transcript, delta for delta',
    async (length, name) => {
      const chunks = await readAll(await start({ ...SAMPLES[name], details: 'a'.repeat(length) }));
      const deltas = decodeTranscript(chunks.join(''));

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

  it('rejects an unknown scenario with 400 invalid_request', async () => {
    const response = await mockProvider(input, {
      signal: new AbortController().signal,
      request: SAMPLES.short,
      headers: new Headers({ 'x-mock-scenario': 'bogus' }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'invalid_request' } });
  });

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
});
