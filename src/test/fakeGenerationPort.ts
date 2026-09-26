import type { GenerateRequest } from '../../shared/generation';
import { type GenerationError, GenerationFailure } from '../features/generation/errors';
import type { GenerationPort } from '../features/generation/generationClient';

type Step =
  | { type: 'delta'; text: string }
  | { type: 'end' }
  | { type: 'fail'; error: GenerationError };

export type FakeRun = {
  request: GenerateRequest;
  signal: AbortSignal;
  emit(...texts: string[]): void;
  end(): void;
  fail(error: GenerationError): void;
};

// A port the test drives: every call starts a run that yields exactly what the test emits, and
// throws the AbortError once its signal aborts, as the real client does.
export function createFakePort() {
  const runs: FakeRun[] = [];

  const port: GenerationPort = (request, signal) => {
    const steps: Step[] = [];
    let wake = () => {};
    const push = (...next: Step[]) => {
      steps.push(...next);
      wake();
    };
    runs.push({
      request,
      signal,
      emit: (...texts) => push(...texts.map((text) => ({ type: 'delta' as const, text }))),
      end: () => push({ type: 'end' }),
      fail: (error) => push({ type: 'fail', error }),
    });

    return (async function* () {
      for (;;) {
        signal.throwIfAborted();
        const step = steps.shift();
        if (!step) {
          await new Promise<void>((resolve) => {
            wake = resolve;
            signal.addEventListener('abort', () => resolve(), { once: true });
          });
          continue;
        }
        if (step.type === 'end') return;
        if (step.type === 'fail') throw new GenerationFailure(step.error);
        yield step.text;
      }
    })();
  };

  return {
    port,
    runs,
    lastRun(): FakeRun {
      const run = runs.at(-1);
      if (!run) throw new Error('The port was never called');
      return run;
    },
  };
}
