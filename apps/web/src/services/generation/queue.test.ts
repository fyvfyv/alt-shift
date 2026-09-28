import type { GenerateRequest } from '@alt-shift/shared/types';
import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryLetterRepository } from '@services/letters/inMemoryRepository';
import { loadLetterStore } from '@services/letters/store';
import { FakeGenerationPort } from '@test/fakeGenerationPort';
import { lettersOf } from '@test/letters';
import { GenerationQueue } from './queue';
import type { GenerationPort } from './types';

const request = (company: string): GenerateRequest => ({
  jobTitle: 'Designer',
  company,
  skills: 'Figma',
  details: '',
});

async function setUp(
  port: GenerationPort = new FakeGenerationPort().port,
  repository = new InMemoryLetterRepository(),
) {
  const letters = await loadLetterStore(repository);
  const queue = new GenerationQueue({ port, letters });
  return { letters, queue, repository };
}

describe('GenerationQueue', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('writes one letter at a time, in the order asked, each saved where it was asked for', async () => {
    const fake = new FakeGenerationPort();
    const { letters, queue } = await setUp(fake.port);
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    queue.enqueue({ id: 'apple', request: request('Apple') });
    now.mockReturnValue(2_000);
    queue.enqueue({ id: 'stripe', request: request('Stripe') });
    expect(fake.runs.map((run) => run.request.company)).toEqual(['Apple']);

    now.mockReturnValue(9_000);
    fake.lastRun().emit('Dear Apple');
    fake.lastRun().end();
    await waitFor(() => expect(fake.runs).toHaveLength(2));
    fake.lastRun().emit('Dear Stripe');
    fake.lastRun().end();

    await waitFor(() => expect(letters.getState().letters).toHaveLength(2));
    expect(letters.getState().letters.map((l) => [l.text, l.createdAt])).toEqual([
      ['Dear Stripe', 2_000],
      ['Dear Apple', 1_000],
    ]);
  });

  it('waits out a 429 before starting the next letter', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const fake = new FakeGenerationPort();
    const { queue } = await setUp(fake.port);
    queue.enqueue({ id: 'apple', request: request('Apple') });
    queue.enqueue({ id: 'stripe', request: request('Stripe') });

    fake.lastRun().fail({ kind: 'rate-limit', retryAt: Date.now() + 1_000 });
    await vi.advanceTimersByTimeAsync(999);
    expect(fake.runs).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fake.runs.map((run) => run.request.company)).toEqual(['Apple', 'Stripe']);
  });

  it('a cancelled letter saves nothing, even when its stream then ends normally, and only the next one starts', async () => {
    const finish = Promise.withResolvers<void>();
    const calls: string[] = [];
    const fake = new FakeGenerationPort();
    // Like the real client draining after [DONE]: it ignores the abort and returns normally.
    const port: GenerationPort = (req, signal) => {
      calls.push(req.company);
      if (req.company !== 'Apple') return fake.port(req, signal);
      return (async function* () {
        yield 'Dear Apple';
        await finish.promise;
      })();
    };
    const { queue, repository } = await setUp(port);
    for (const company of ['Apple', 'Stripe', 'Google']) {
      queue.enqueue({ id: company, request: request(company) });
    }
    await waitFor(() => expect(queue.store.getState().runs[0]?.state.status).toBe('streaming'));

    queue.remove('Apple');
    finish.resolve();

    await waitFor(() => expect(calls).toEqual(['Apple', 'Stripe']));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls).toEqual(['Apple', 'Stripe']);
    expect(await repository.list()).toEqual([]);
    expect(queue.store.getState().runs.map((run) => run.id)).toEqual(['Stripe', 'Google']);
  });

  it('holds while the browser is offline and starts when it is back', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fake = new FakeGenerationPort();
    const { queue } = await setUp(fake.port);

    queue.enqueue({ id: 'apple', request: request('Apple') });
    expect(fake.runs).toHaveLength(0);

    onLine.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    expect(fake.runs).toHaveLength(1);
  });

  it('a deleted letter takes its new version with it', async () => {
    const fake = new FakeGenerationPort();
    const { letters, queue } = await setUp(fake.port, new InMemoryLetterRepository(lettersOf(1)));
    queue.enqueue({ id: 'letter-0', request: request('Acme') });

    await letters.getState().remove('letter-0');

    expect(fake.lastRun().signal.aborted).toBe(true);
    expect(queue.store.getState().runs).toEqual([]);
  });
});
