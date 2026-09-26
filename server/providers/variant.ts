import { jsonError } from '../jsonError';
import type { Provider } from './types';

const DEFAULT_API_URL = 'https://test-assignment-api.variant.net/v1/generate';

// Only these reach the browser; upstream cookies, CORS and anything else stay behind the proxy.
const FORWARDED_HEADERS = ['Content-Type', 'Retry-After', 'X-Request-Id'];

export const variantProvider: Provider = async (input, { signal }) => {
  let upstream: Response;
  try {
    upstream = await fetch(process.env.GENERATION_API_URL ?? DEFAULT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GENERATION_API_TOKEN ?? ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    return jsonError(502, 'upstream_error', 'The generation service is unreachable.');
  }

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
};
