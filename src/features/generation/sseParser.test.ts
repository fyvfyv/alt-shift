import { describe, expect, it } from 'vitest';
import { recorded } from '../../test/fixtures';
import { createSseParser, type SseMessage } from './sseParser';
import { decode } from './variantDecoder';

function parseAll(chunks: string[]): SseMessage[] {
  const parser = createSseParser();
  return chunks.flatMap((chunk) => parser.feed(chunk));
}

function deltaTexts(messages: SseMessage[]): string[] {
  return messages.flatMap((message) => {
    const event = decode(message);
    return event?.type === 'delta' ? [event.text] : [];
  });
}

describe('createSseParser + decode', () => {
  const fixture = recorded('short');

  it('turns a recorded transcript into exactly its deltas', () => {
    const texts = deltaTexts(parseAll([fixture.sse]));

    expect(texts).toHaveLength(fixture.deltaCount);
    expect(texts.join('')).toBe(fixture.text);
  });

  it('yields the same sequence when the transcript arrives one character per chunk', () => {
    expect(parseAll([...fixture.sse])).toEqual(parseAll([fixture.sse]));
  });

  it('accepts CRLF and bare CR line endings, including a CRLF split across chunks', () => {
    const lf = parseAll([fixture.sse]);

    expect(parseAll([fixture.sse.replaceAll('\n', '\r\n')])).toEqual(lf);
    expect(parseAll([...fixture.sse.replaceAll('\n', '\r\n')])).toEqual(lf);
    expect(parseAll([fixture.sse.replaceAll('\n', '\r')])).toEqual(lf);
  });

  it('produces no message for a keepalive comment', () => {
    expect(parseAll([': keepalive\n\n'])).toEqual([]);
  });

  it('follows the event-stream field rules', () => {
    const stream =
      '\uFEFFdata:no space\n\n' +
      'data: line one\ndata: line two\nid: 7\nretry: 1000\nunknown: x\n\n' +
      'event: delta\ndata: {"text":"a"}\n\n' +
      'data: after\n\n' +
      'data\n\n';

    expect(parseAll([stream])).toEqual([
      { event: 'message', data: 'no space' },
      { event: 'message', data: 'line one\nline two' },
      { event: 'delta', data: '{"text":"a"}' },
      { event: 'message', data: 'after' },
      { event: 'message', data: '' },
    ]);
  });

  it('discards an event that the stream never terminated with a blank line', () => {
    expect(parseAll(['data: complete\n\n', 'data: partial\n'])).toEqual([
      { event: 'message', data: 'complete' },
    ]);
  });
});

describe('decode', () => {
  it.each([
    ['a delta event', { event: 'delta', data: '{"text":"Hi"}' }, { type: 'delta', text: 'Hi' }],
    ['the terminator', { event: 'message', data: '[DONE]' }, { type: 'done' }],
    ['an unknown event', { event: 'ping', data: '{"text":"Hi"}' }, null],
    ['malformed JSON', { event: 'delta', data: '{"text":' }, null],
    ['a payload without text', { event: 'delta', data: '{"content":"Hi"}' }, null],
    ['a JSON null payload', { event: 'delta', data: 'null' }, null],
  ])('maps %s', (_, message, expected) => {
    expect(decode(message)).toEqual(expected);
  });
});
