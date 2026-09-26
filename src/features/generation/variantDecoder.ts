import type { SseMessage } from './sseParser';

// Variant's payloads: `event: delta` + `data: {"text":"…"}`, then a bare `data: [DONE]`.
// The terminator is not in the published spec, but the live API sends it.
export type VariantEvent = { type: 'delta'; text: string } | { type: 'done' };

export function decode(message: SseMessage): VariantEvent | null {
  if (message.data === '[DONE]') return { type: 'done' };
  if (message.event !== 'delta' && message.event !== 'message') return null;

  let payload: unknown;
  try {
    payload = JSON.parse(message.data);
  } catch {
    return null;
  }
  const text = (payload as { text?: unknown } | null)?.text;
  return typeof text === 'string' ? { type: 'delta', text } : null;
}
