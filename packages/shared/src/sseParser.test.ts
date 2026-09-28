import { describe, expect, it } from 'vitest';
import { type SseMessage, SseParser, SseParserStream } from './sseParser';
import {
  DONE_EVENT,
  decode,
  decodeTranscript,
  encodeDelta,
  KEEPALIVE_COMMENT,
  type VariantEvent,
  VariantEventStream,
} from './variantDecoder';

// Shaped like the recorded transcripts: a keepalive comment, delta events, then [DONE].
const sse =
  ': keepalive\n\nevent: delta\ndata: {"text":"Dear"}\n\n' +
  'event: delta\ndata: {"text":" Apple team,\\n\\n"}\n\ndata: [DONE]\n\n';

function parseAll(chunks: string[]): SseMessage[] {
  const parser = new SseParser();
  return chunks.flatMap((chunk) => parser.feed(chunk));
}

describe('SseParser', () => {
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

describe('decodeTranscript', () => {
  it('reads back the text of the events the mock writes', () => {
    const transcript =
      KEEPALIVE_COMMENT + encodeDelta('Dear') + encodeDelta(' team,\n\n') + DONE_EVENT;

    expect(decodeTranscript(transcript)).toEqual(['Dear', ' team,\n\n']);
  });
});

describe('SseParserStream into VariantEventStream', () => {
  it('turns a transcript split anywhere into Variant events, dropping everything else', async () => {
    const transcript =
      KEEPALIVE_COMMENT +
      encodeDelta('Dear') +
      'event: ping\ndata: {}\n\n' +
      'event: delta\ndata: {"text":\n\n' +
      encodeDelta(' team,\n\n') +
      DONE_EVENT;
    const chars = new ReadableStream<string>({
      start(controller) {
        for (const char of transcript) controller.enqueue(char);
        controller.close();
      },
    });

    const events: VariantEvent[] = [];
    const stream = chars.pipeThrough(new SseParserStream()).pipeThrough(new VariantEventStream());
    for await (const event of stream) events.push(event);

    expect(events).toEqual([
      { type: 'delta', text: 'Dear' },
      { type: 'delta', text: ' team,\n\n' },
      { type: 'done' },
    ]);
  });
});
