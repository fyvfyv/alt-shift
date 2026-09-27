import { jsonError } from '../jsonError.js';
import type { Provider } from './types.js';

export const DEFAULT_API_URL = 'https://test-assignment-api.variant.net/v1/generate';
const DEFAULT_FIRST_BYTE_TIMEOUT_MS = 20_000;

// Only these reach the browser; upstream cookies, CORS and anything else stay behind the proxy.
const FORWARDED_HEADERS = ['Content-Type', 'Retry-After', 'X-Request-Id'];

export const variantProvider: Provider = async (input, { signal }) => {
  // Bounds only the wait for headers; AbortSignal.timeout would also cut a slow body mid-letter.
  const firstByte = new AbortController();
  const timer = setTimeout(
    () => firstByte.abort(new Error('First byte timeout')),
    Number(process.env.GENERATION_FIRST_BYTE_TIMEOUT_MS ?? DEFAULT_FIRST_BYTE_TIMEOUT_MS),
  );

  let upstream: Response;
  try {
    upstream = await fetch(process.env.GENERATION_API_URL ?? DEFAULT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GENERATION_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.any([signal, firstByte.signal]),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (firstByte.signal.aborted) {
      return jsonError(504, 'upstream_error', 'The model took too long to start.');
    }
    return jsonError(502, 'upstream_error', 'The generation service is unreachable.');
  } finally {
    clearTimeout(timer);
  }

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
};
