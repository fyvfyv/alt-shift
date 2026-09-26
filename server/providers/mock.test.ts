import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

async function start(
  details: string,
  mockScenario?: string,
  signal = new AbortController().signal,
) {
  const response = await mockProvider(input, { signal, details, mockScenario });
  if (!response.body) throw new Error('expected a streaming body');
  return response.body.pipeThrough(new TextDecoderStream()).getReader();
}

describe('mockProvider', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_FIRST_DELTA_MS', '0');
    vi.stubEnv('MOCK_DELAY_MS', '0');
  });

  it.each([
    ['short', ''],
    ['long', 'x'.repeat(700)],
  ])('replays the %s transcript for details of that length', async (name, details) => {
    const reader = await start(details);
    const texts: string[] = [];
    for (let result = await reader.read(); !result.done; result = await reader.read()) {
      texts.push(...deltaTexts(result.value));
    }

    const fixture = await expected(name);
    expect(texts).toHaveLength(fixture.deltaCount);
    expect(texts.join('')).toBe(fixture.text);
  });

  it('errors the stream part-way through on the disconnect scenario', async () => {
    const reader = await start('', 'disconnect');
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

  it('enqueues nothing after the signal aborts', async () => {
    const controller = new AbortController();
    const reader = await start('', undefined, controller.signal);
    expect((await reader.read()).value).toBe(': keepalive\n\n');

    controller.abort();

    await expect(reader.read()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
