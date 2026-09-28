// WHATWG event-stream parser (html.spec.whatwg.org/multipage/server-sent-events.html),
// hand-rolled because EventSource cannot POST.

export type SseMessage = { event: string; data: string };

export class SseParser {
  #buffer = '';
  #atStreamStart = true;
  // A chunk ended on CR: a LF opening the next chunk completes that CRLF instead of ending a line.
  #pendingCr = false;
  #eventType = '';
  #dataLines: string[] = [];

  feed(chunk: string): SseMessage[] {
    let text = chunk;
    if (this.#atStreamStart && text !== '') {
      this.#atStreamStart = false;
      if (text.startsWith('\uFEFF')) text = text.slice(1);
    }
    if (this.#pendingCr && text !== '') {
      this.#pendingCr = false;
      if (text.startsWith('\n')) text = text.slice(1);
    }
    this.#buffer += text;

    const messages: SseMessage[] = [];
    let lineStart = 0;
    for (let i = 0; i < this.#buffer.length; i++) {
      const char = this.#buffer[i];
      if (char !== '\n' && char !== '\r') continue;
      const message = this.#processLine(this.#buffer.slice(lineStart, i));
      if (message) messages.push(message);
      if (char === '\r') {
        if (i + 1 === this.#buffer.length) this.#pendingCr = true;
        else if (this.#buffer[i + 1] === '\n') i++;
      }
      lineStart = i + 1;
    }
    this.#buffer = this.#buffer.slice(lineStart);
    return messages;
  }

  #processLine(line: string): SseMessage | undefined {
    if (line === '') return this.#dispatch();
    if (line.startsWith(':')) return undefined;

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') this.#eventType = value;
    else if (field === 'data') this.#dataLines.push(value);
    return undefined;
  }

  // A blank line ends the event; one without data lines dispatches nothing.
  #dispatch(): SseMessage | undefined {
    const message =
      this.#dataLines.length > 0
        ? { event: this.#eventType || 'message', data: this.#dataLines.join('\n') }
        : undefined;
    this.#eventType = '';
    this.#dataLines = [];
    return message;
  }
}

export class SseParserStream extends TransformStream<string, SseMessage> {
  constructor() {
    const parser = new SseParser();
    super({
      transform(chunk, controller) {
        for (const message of parser.feed(chunk)) controller.enqueue(message);
      },
    });
  }
}
