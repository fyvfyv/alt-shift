import { createStore, type StoreApi } from 'zustand/vanilla';
import { createLetter } from '@services/letters/model';
import type { LetterStore } from '@services/letters/types';
import { GenerationFailure } from './errors';
import { FrameBatcher } from './frameBatcher';
import { generationReducer } from './generationReducer';
import { isPending } from './selectors';
import type {
  Attempt,
  GenerationEvent,
  GenerationPort,
  NewRun,
  QueueDependencies,
  QueueState,
  Run,
} from './types';

// One letter at a time: every visitor shares one rate-limited key for the generation API.
export class GenerationQueue {
  readonly store: StoreApi<QueueState>;
  readonly #port: GenerationPort;
  readonly #letters: LetterStore;
  #active: Attempt | null = null;
  #wake: ReturnType<typeof setTimeout> | undefined;

  constructor({ port, letters }: QueueDependencies) {
    this.#port = port;
    this.#letters = letters;
    this.store = createStore<QueueState>()(() => ({
      runs: [],
      heldUntil: 0,
      enqueue: (run) => this.enqueue(run),
      remove: (id) => this.remove(id),
    }));

    // A letter deleted here or in another tab takes its runs with it; a pending one is cancelled.
    letters.subscribe((next, previous) => {
      if (next.letters === previous.letters) return;
      const kept = new Set(next.letters.map((letter) => letter.id));
      for (const letter of previous.letters) if (!kept.has(letter.id)) this.remove(letter.id);
    });
    window.addEventListener('online', () => this.#pump());
  }

  enqueue({ id, request, previous }: NewRun): void {
    const { runs } = this.store.getState();
    const old = runs.find((run) => run.id === id);
    if (old && isPending(old.state)) return;
    const saved = this.#letters.getState().letters.find((letter) => letter.id === id);
    const run: Run = {
      id,
      key: crypto.randomUUID(),
      createdAt: old?.createdAt ?? saved?.createdAt ?? Date.now(),
      request,
      state: { status: 'queued', previous },
    };
    this.store.setState({ runs: [...runs.filter((r) => r.id !== id), run] });
    this.#pump();
  }

  remove(id: string): void {
    const run = this.store.getState().runs.find((r) => r.id === id);
    if (!run) return;
    if (this.#active?.key === run.key) {
      this.#active.controller.abort();
      this.#active = null;
    }
    this.store.setState(({ runs }) => ({ runs: runs.filter((r) => r.id !== id) }));
    this.#pump();
  }

  #update(key: string, event: GenerationEvent): void {
    this.store.setState(({ runs }) => ({
      runs: runs.map((run) =>
        run.key === key ? { ...run, state: generationReducer(run.state, event) } : run,
      ),
    }));
  }

  #pump(): void {
    clearTimeout(this.#wake);
    if (this.#active || !navigator.onLine) return;
    const { runs, heldUntil } = this.store.getState();
    const wait = heldUntil - Date.now();
    if (wait > 0) {
      this.#wake = setTimeout(() => this.#pump(), wait);
      return;
    }
    const next = runs.find((run) => run.state.status === 'queued');
    if (next) void this.#attempt(next);
  }

  async #attempt(run: Run): Promise<void> {
    const self: Attempt = { key: run.key, controller: new AbortController() };
    const { signal } = self.controller;
    this.#active = self;
    this.#update(run.key, { type: 'start' });

    let text = '';
    const deltas = new FrameBatcher((unsent) =>
      this.#update(run.key, { type: 'delta', text: unsent }),
    );
    signal.addEventListener('abort', () => deltas.cancel());

    try {
      for await (const delta of this.#port(run.request, signal)) {
        if (signal.aborted) return;
        text += delta;
        deltas.push(delta);
      }
      // The client drains the connection after [DONE] and can end normally after a cancel.
      if (signal.aborted) return;
      deltas.flush();
      if (text !== '') {
        const { jobTitle, company } = run.request;
        const letter = createLetter({
          id: run.id,
          createdAt: run.createdAt,
          jobTitle,
          company,
          text,
        });
        void this.#letters.getState().add(letter);
      }
      this.#update(run.key, { type: 'done' });
    } catch (e) {
      if (signal.aborted) return;
      // Flush first, or the cut letter loses its last unrendered deltas.
      deltas.flush();
      if (!(e instanceof GenerationFailure)) console.error('[generation]', e);
      const error = e instanceof GenerationFailure ? e.error : { kind: 'upstream' as const };
      if (error.kind === 'rate-limit') this.store.setState({ heldUntil: error.retryAt });
      this.#update(run.key, { type: 'error', error });
    } finally {
      if (this.#active === self) this.#active = null;
      this.#pump();
    }
  }
}
