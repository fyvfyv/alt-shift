import { once } from 'node:events';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { handle } from '@alt-shift/server/generate';
import { mockProvider } from '@alt-shift/server/providers/mock';
import type { Provider } from '@alt-shift/server/providers/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMiddleware } from './devPlugin';

const body = JSON.stringify({ jobTitle: 'Engineer', company: 'Acme', skills: 'Go', details: '' });

let server: Server;
let providerSignal: AbortSignal;
let responseClosed: Promise<unknown>;

const spyProvider: Provider = (input, ctx) => {
  providerSignal = ctx.signal;
  return mockProvider(input, ctx);
};

async function listen(): Promise<number> {
  server = createServer(generateMiddleware((req) => handle(req, spyProvider, 'mock')));
  server.on('request', (_req, res) => {
    responseClosed = once(res, 'close');
  });
  server.listen(0);
  await once(server, 'listening');
  return (server.address() as AddressInfo).port;
}

async function send(scenario: string, onFirstChunk?: (destroy: () => void) => void) {
  const port = await listen();
  const outcome = Promise.withResolvers<'end' | 'error'>();
  const req = request(
    {
      port,
      method: 'POST',
      path: '/api/generate',
      headers: { 'Content-Type': 'application/json', 'x-mock-scenario': scenario },
    },
    (res) => {
      res.once('data', () => onFirstChunk?.(() => req.destroy()));
      res.on('data', () => {});
      res.on('end', () => outcome.resolve('end'));
      res.on('error', () => outcome.resolve('error'));
    },
  );
  req.on('error', () => outcome.resolve('error'));
  req.end(body);
  return outcome.promise;
}

describe('generateMiddleware', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_FIRST_DELTA_MS', '0');
    vi.stubEnv('MOCK_DELAY_MS', '0');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    server.closeAllConnections();
    server.close();
  });

  it('aborts the provider when the client disconnects mid-stream', async () => {
    vi.stubEnv('MOCK_DELAY_MS', '20');

    await send('complete', (destroy) => destroy());

    await vi.waitFor(() => expect(providerSignal.aborted).toBe(true));
  });

  it('leaves the provider signal alone when the response completes', async () => {
    expect(await send('complete')).toBe('end');
    expect(providerSignal.aborted).toBe(false);
  });

  it('destroys the socket instead of ending cleanly when the stream breaks', async () => {
    expect(await send('disconnect')).toBe('error');
    await responseClosed;
    expect(providerSignal.aborted).toBe(false);
  });
});
