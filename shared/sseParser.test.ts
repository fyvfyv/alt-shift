import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createSseParser, type SseMessage } from './sseParser';
import { decode } from './variantDecoder';

const sse = await readFile(new URL('../server/fixtures/short.sse', import.meta.url), 'utf8');

function parseAll(chunks: string[]): SseMessage[] {
  const parser = createSseParser();
  return chunks.flatMap((chunk) => parser.feed(chunk));
}

describe('createSseParser', () => {
  it('accepts CRLF and bare CR line endings, including a CRLF split across chunks', () => {
    const lf = parseAll([sse]);

    expect(parseAll([sse.replaceAll('\n', '\r\n')])).toEqual(lf);
    expect(parseAll([...sse.replaceAll('\n', '\r\n')])).toEqual(lf);
    expect(parseAll([sse.replaceAll('\n', '\r')])).toEqual(lf);
  });

  it('follows the event-stream field rules', () => {
    const stream =
      '\uFEFFdata:no space\n\n' +
      'data: line one\ndata: line two\nid: 7\nretry: 1000\nunknown: x\n\n' +
      'event: delta\ndata: {"text":"a"}\n\n' +
      'data: after\n\n' +
      'data\n\n' +
      'data: never terminated\n';

    expect(parseAll([stream])).toEqual([
      { event: 'message', data: 'no space' },
      { event: 'message', data: 'line one\nline two' },
      { event: 'delta', data: '{"text":"a"}' },
      { event: 'message', data: 'after' },
      { event: 'message', data: '' },
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
