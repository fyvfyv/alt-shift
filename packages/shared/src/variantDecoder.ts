// Beyond its published spec the live API opens with `: keepalive` when the first token is slow
// and ends with a bare `data: [DONE]`.

import { type SseMessage, SseParser } from './sseParser.js';

export type VariantEvent = { type: 'delta'; text: string } | { type: 'done' };

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
  const text = payload instanceof Object && 'text' in payload ? payload.text : undefined;
  return typeof text === 'string' ? { type: 'delta', text } : null;
}

export class VariantEventStream extends TransformStream<SseMessage, VariantEvent> {
  constructor() {
    super({
      transform(message, controller) {
        const event = decode(message);
        if (event) controller.enqueue(event);
      },
    });
  }
}

export function decodeTranscript(raw: string): string[] {
  return new SseParser().feed(raw).flatMap((message) => {
    const event = decode(message);
    return event?.type === 'delta' ? [event.text] : [];
  });
}
