// Builds the prompt here, not in the browser, so the token can't be spent on arbitrary prompts.

import { validateGenerateRequest } from '../shared/generation.js';
import { jsonError } from './jsonError.js';
import { buildPrompt } from './prompt.js';
import { type ProviderName, providers, resolveProvider } from './providers/index.js';
import type { Provider } from './providers/types.js';

// The demo spends one shared upstream token with a 6 req/min limit, so a page on another origin
// must not be able to drain it through visitors' browsers. Browsers always send Sec-Fetch-Site
// and, on POST, Origin; requests without them (curl, Playwright's request context) pass — this
// is CSRF hygiene, not authentication.
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

  const upstream = await provider(buildPrompt(result.value), {
    signal: request.signal,
    request: result.value,
    headers: request.headers,
  });

  const headers = new Headers(upstream.headers);
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('X-Generation-Provider', providerName);
  console.info(
    `[generate] ${providerName} ${upstream.status} x-request-id=${headers.get('X-Request-Id') ?? '-'}`,
  );
  return new Response(upstream.body, { status: upstream.status, headers });
}

export function POST(request: Request): Promise<Response> {
  const name = resolveProvider(process.env);
  return handle(request, providers[name], name);
}
