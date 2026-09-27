import { once } from 'node:events';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMiddleware } from './devPlugin';
import { handle } from './generate';
import { mockProvider } from './providers/mock';
import type { Provider } from './providers/types';

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
  await new Promise<void>((resolve) => server.listen(0, resolve));
  return (server.address() as AddressInfo).port;
}

async function send(scenario: string, onFirstChunk?: (destroy: () => void) => void) {
  const port = await listen();
  return new Promise<'end' | 'error'>((resolve) => {
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
        res.on('end', () => resolve('end'));
        res.on('error', () => resolve('error'));
      },
    );
    req.on('error', () => resolve('error'));
    req.end(body);
  });
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
