// The server modules are type imports and load through ssrLoadModule: server edits apply without a
// restart, and vite.config stays light.

import type { ServerResponse } from 'node:http';
import type * as GenerateModule from '@alt-shift/server/generate';
import type * as ProvidersModule from '@alt-shift/server/providers';
import type { ApiErrorBody } from '@alt-shift/server/types';
import { type Connect, loadEnv, type Plugin } from 'vite';

type Handler = (request: Request) => Promise<Response>;

export function generateMiddleware(handler: Handler) {
  return async (req: Connect.IncomingMessage, res: ServerResponse): Promise<void> => {
    const controller = new AbortController();
    let failed = false;
    // Not req.on('close'): since Node 16 it fires once the request body is read, not on disconnect.
    res.on('close', () => {
      if (!res.writableFinished && !failed) controller.abort();
    });

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers.set(name, value);
      }
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const request = new Request(`http://${req.headers.host}${req.originalUrl ?? req.url}`, {
        method: req.method,
        headers,
        body: hasBody ? Buffer.concat(chunks) : undefined,
        signal: controller.signal,
      });

      const response = await handler(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) {
        for await (const chunk of response.body) res.write(chunk);
      }
      res.end();
    } catch (error) {
      if (!controller.signal.aborted) console.error('[generate]', error);
      if (!res.headersSent && !res.destroyed) {
        const body: ApiErrorBody = {
          error: { code: 'upstream_error', message: 'The generation handler failed.' },
        };
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
        return;
      }
      // No chunked terminator, so the browser's read() fails like a dropped upstream; `failed`
      // keeps this self-inflicted close from aborting the request.
      failed = true;
      res.destroy();
    }
  };
}

export function generateApiPlugin(): Plugin {
  return {
    name: 'alt-shift:generate-api',
    apply: 'serve',
    config(config, { mode }) {
      // '' loads unprefixed vars too (the token has no VITE_ prefix); shell values still win.
      Object.assign(process.env, loadEnv(mode, config.envDir || process.cwd(), ''));
    },
    async configureServer(server) {
      const load = <T>(path: string) => server.ssrLoadModule(path) as Promise<T>;
      const { resolveProvider } = await load<typeof ProvidersModule>('@alt-shift/server/providers');
      server.config.logger.info(`  /api/generate → ${resolveProvider(process.env)} provider`);
      server.middlewares.use(
        '/api/generate',
        generateMiddleware(async (request) => {
          const { POST } = await load<typeof GenerateModule>('@alt-shift/server/generate');
          return POST(request);
        }),
      );
    },
  };
}
