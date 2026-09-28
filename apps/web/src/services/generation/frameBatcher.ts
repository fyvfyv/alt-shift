// Deltas arriving within one animation frame reach the store as one update.
export class FrameBatcher {
  readonly #send: (text: string) => void;
  #unsent = '';
  #frame: number | null = null;

  constructor(send: (text: string) => void) {
    this.#send = send;
  }

  push(text: string): void {
    this.#unsent += text;
    this.#frame ??= requestAnimationFrame(() => this.flush());
  }

  flush(): void {
    this.cancel();
    if (this.#unsent === '') return;
    this.#send(this.#unsent);
    this.#unsent = '';
  }

  // Drops the scheduled frame; text already pushed waits for the next flush().
  cancel(): void {
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    this.#frame = null;
  }
}
