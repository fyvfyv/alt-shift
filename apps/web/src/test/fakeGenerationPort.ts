import type { GenerateRequest } from '@alt-shift/shared/types';
import { GenerationFailure } from '@services/generation/errors';
import type { GenerationError, GenerationPort } from '@services/generation/types';

type Step =
  | { type: 'delta'; text: string }
  | { type: 'end' }
  | { type: 'fail'; error: GenerationError };

// One call of the port: the stream yields what the test scripts, when it scripts it.
class FakeRun {
  readonly request: GenerateRequest;
  readonly signal: AbortSignal;
  readonly #steps: Step[] = [];
  #wake = Promise.withResolvers<void>();

  constructor(request: GenerateRequest, signal: AbortSignal) {
    this.request = request;
    this.signal = signal;
    signal.addEventListener('abort', () => this.#wake.resolve(), { once: true });
  }

  emit(...texts: string[]): void {
    this.#push(...texts.map((text) => ({ type: 'delta' as const, text })));
  }

  end(): void {
    this.#push({ type: 'end' });
  }

  fail(error: GenerationError): void {
    this.#push({ type: 'fail', error });
  }

  async *stream(): AsyncGenerator<string> {
    for (;;) {
      this.signal.throwIfAborted();
      const step = this.#steps.shift();
      if (!step) {
        this.#wake = Promise.withResolvers();
        await this.#wake.promise;
        continue;
      }
      if (step.type === 'end') return;
      if (step.type === 'fail') throw new GenerationFailure(step.error);
      yield step.text;
    }
  }

  #push(...steps: Step[]): void {
    this.#steps.push(...steps);
    this.#wake.resolve();
  }
}

export class FakeGenerationPort {
  readonly runs: FakeRun[] = [];

  // A field, not a method: callers pass `fake.port` on without its object.
  readonly port: GenerationPort = (request, signal) => {
    const run = new FakeRun(request, signal);
    this.runs.push(run);
    return run.stream();
  };

  lastRun(): FakeRun {
    const run = this.runs.at(-1);
    if (!run) throw new Error('The port was never called');
    return run;
  }
}
