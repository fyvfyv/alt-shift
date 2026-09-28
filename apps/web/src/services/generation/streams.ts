import type { Reader } from './types';

// Safari closes the connection when the body's own reader cancels, not when a pipe out of the body
// does: every cancel of the pipeline has to end in this reader.
export class BodySource implements UnderlyingDefaultSource<Uint8Array<ArrayBuffer>> {
  readonly #reader: Reader;

  constructor(body: ReadableStream<Uint8Array<ArrayBuffer>>) {
    this.#reader = body.getReader();
  }

  async pull(controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>): Promise<void> {
    const { value, done } = await this.#reader.read();
    if (done) controller.close();
    else controller.enqueue(value);
  }

  cancel(reason: unknown): Promise<void> {
    return this.#reader.cancel(reason);
  }
}

// Erroring is enough: the pipe feeding this stage then cancels the upstream.
export class IdleTimeoutStream<T> extends TransformStream<T, T> {
  constructor(ms: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const restart = (controller: TransformStreamDefaultController<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => controller.error(new DOMException('Idle', 'TimeoutError')), ms);
    };
    super({
      start: restart,
      transform(chunk, controller) {
        restart(controller);
        controller.enqueue(chunk);
      },
      flush: () => clearTimeout(timer),
    });
  }
}
