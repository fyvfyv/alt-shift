// The one module that knows Variant's payloads: the client decodes with it, and the mock and the
// fixture recorder encode and parse with it, so a wire format change is one edit.
// The stream may open with a `: keepalive` comment (the live API sends one when the first token is
// slow), then `event: delta` + `data: {"text":"…"}` per chunk, then a bare `data: [DONE]`. The
// terminator is not in the published spec, but the live API sends it.

import { createSseParser, type SseMessage } from './sseParser.js';

type VariantEvent = { type: 'delta'; text: string } | { type: 'done' };

export const KEEPALIVE_COMMENT = ': keepalive\n\n';
export const DONE_EVENT = 'data: [DONE]\n\n';

export function encodeDelta(text: string): string {
  return `event: delta\ndata: ${JSON.stringify({ text })}\n\n`;
}

export function decode(message: SseMessage): VariantEvent | null {
  if (message.data === '[DONE]') return { type: 'done' };
  if (message.event !== 'delta') return null;

  let payload: unknown;
  try {
    payload = JSON.parse(message.data);
  } catch {
    return null;
  }
  const text = (payload as { text?: unknown } | null)?.text;
  return typeof text === 'string' ? { type: 'delta', text } : null;
}

export function decodeTranscript(raw: string): string[] {
  return createSseParser()
    .feed(raw)
    .flatMap((message) => {
      const event = decode(message);
      return event?.type === 'delta' ? [event.text] : [];
    });
}
