import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerateRequest } from '../../shared/generation';
import { SAMPLES } from '../fixtures/samples';
import { mockProvider } from './mock';

const input = { system: '', prompt: '', maxTokens: 900 };

async function expected(name: string): Promise<{ deltaCount: number; text: string }> {
  const url = new URL(`../fixtures/${name}.expected.json`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

function deltaTexts(chunk: string): string[] {
  return chunk
    .split('\n')
    .filter((line) => line.startsWith('data: {'))
    .map((line) => JSON.parse(line.slice(6)).text);
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

describe('mockProvider', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_FIRST_DELTA_MS', '0');
    vi.stubEnv('MOCK_DELAY_MS', '0');
  });

  it.each(['short', 'long'] as const)(
    'replays the %s transcript verbatim for the request it was recorded with',
    async (name) => {
      const texts = (await readAll(await start(SAMPLES[name]))).flatMap(deltaTexts);

      const fixture = await expected(name);
      expect(texts).toHaveLength(fixture.deltaCount);
      expect(texts.join('')).toBe(fixture.text);
    },
  );

  it('swaps the recorded job title and company for the request values', async () => {
    const chunks = await readAll(
      await start({ ...SAMPLES.short, jobTitle: 'QA Lead', company: 'Acme' }),
    );
    const text = chunks.flatMap(deltaTexts).join('');

    expect(text).toContain('Dear Acme team,');
    expect(text).toContain('QA Lead');
    expect(text).not.toContain('Northwind');
    expect(text).not.toContain('Frontend Engineer');
    expect(chunks[0]).toBe(': keepalive\n\n');
    expect(chunks.at(-1)).toBe('data: [DONE]\n\n');
  });

  it('errors the stream part-way through on the disconnect scenario', async () => {
    const reader = await start(SAMPLES.short, 'disconnect');
    let deltas = 0;

    await expect(
      (async () => {
        for (;;) {
          const { value = '' } = await reader.read();
          deltas += deltaTexts(value).length;
        }
      })(),
    ).rejects.toThrow('Mock disconnect');

    const { deltaCount } = await expected('short');
    expect(deltas).toBeGreaterThan(0);
    expect(deltas).toBeLessThan(deltaCount);
  });

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
