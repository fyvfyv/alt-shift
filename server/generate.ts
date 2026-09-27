import { countChars, validateGenerateRequest } from '../shared/generation.js';
import { jsonError } from './jsonError.js';
import { buildPrompt } from './prompt.js';
import { type ProviderName, providers, resolveProvider } from './providers/index.js';
import type { Provider } from './providers/types.js';

// CSRF hygiene for the shared, rate-limited token, not auth: header-less requests (curl) pass.
function isCrossOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin' && site !== 'none') return true;

  const origin = request.headers.get('origin');
  if (origin === null) return false;
  try {
    return new URL(origin).host !== request.headers.get('host')?.toLowerCase();
  } catch {
    return true;
  }
}

export async function handle(
  request: Request,
  provider: Provider,
  providerName: ProviderName,
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError(405, 'method_not_allowed', 'Use POST.', { Allow: 'POST' });
  }
  if (isCrossOrigin(request)) {
    return jsonError(403, 'forbidden', 'Cross-origin requests are not allowed.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_request', 'Request body must be valid JSON.');
  }
  const result = validateGenerateRequest(body);
  if (!result.ok) return jsonError(400, 'invalid_request', result.message);

  const startedAt = Date.now();
  // Never log field values: they are personal text.
  const log = (line: Record<string, unknown>) => console.info(JSON.stringify(line));
  const logGenerate = (status: number, requestId: string | null) =>
    log({
      event: 'generate',
      provider: providerName,
      status,
      waitMs: Date.now() - startedAt,
      detailsChars: countChars(result.value.details),
      skillsChars: countChars(result.value.skills),
      requestId,
    });

  let upstream: Response;
  try {
    upstream = await provider(buildPrompt(result.value), {
      signal: request.signal,
      request: result.value,
      headers: request.headers,
    });
  } catch (error) {
    logGenerate(request.signal.aborted ? 499 : 500, null);
    throw error;
  }

  const headers = new Headers(upstream.headers);
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('X-Generation-Provider', providerName);
  logGenerate(upstream.status, headers.get('X-Request-Id'));

  // An abort that fired while the provider resolved never reaches a listener added now.
  const logCancelled = () => log({ event: 'generate_cancelled', provider: providerName });
  if (request.signal.aborted) logCancelled();
  else request.signal.addEventListener('abort', logCancelled, { once: true });

  return new Response(upstream.body, { status: upstream.status, headers });
}

export function POST(request: Request): Promise<Response> {
  const name = resolveProvider(process.env);
  return handle(request, providers[name], name);
}
