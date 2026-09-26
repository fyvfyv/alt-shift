// WHATWG event-stream parser (https://html.spec.whatwg.org/multipage/server-sent-events.html).
// EventSource cannot POST, so the generation stream is read with fetch and parsed here.

export type SseMessage = { event: string; data: string };

export function createSseParser() {
  let buffer = '';
  let atStreamStart = true;
  // A chunk ended on CR: a LF opening the next chunk completes that CRLF instead of ending a line.
  let pendingCr = false;
  let eventType = '';
  let dataLines: string[] = [];

  function processLine(line: string, messages: SseMessage[]) {
    if (line === '') {
      if (dataLines.length > 0) {
        messages.push({ event: eventType || 'message', data: dataLines.join('\n') });
      }
      eventType = '';
      dataLines = [];
      return;
    }
    if (line.startsWith(':')) return;

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') eventType = value;
    else if (field === 'data') dataLines.push(value);
    // `id`, `retry` and unknown fields have no meaning without EventSource reconnection.
  }

  return {
    // Returns the messages completed by this chunk. An event the stream never terminates with a
    // blank line is never returned, as the spec requires.
    feed(chunk: string): SseMessage[] {
      let text = chunk;
      if (atStreamStart && text !== '') {
        atStreamStart = false;
        if (text.startsWith('﻿')) text = text.slice(1);
      }
      if (pendingCr && text !== '') {
        pendingCr = false;
        if (text.startsWith('\n')) text = text.slice(1);
      }
      buffer += text;

      const messages: SseMessage[] = [];
      let lineStart = 0;
      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];
        if (char !== '\n' && char !== '\r') continue;
        processLine(buffer.slice(lineStart, i), messages);
        if (char === '\r') {
          if (i + 1 === buffer.length) pendingCr = true;
          else if (buffer[i + 1] === '\n') i++;
        }
        lineStart = i + 1;
      }
      buffer = buffer.slice(lineStart);
      return messages;
    },
  };
}
