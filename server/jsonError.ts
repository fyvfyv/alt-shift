import type { ApiErrorBody, ErrorCode } from '../shared/generation';

// The same `{ error: { code, message } }` envelope the Variant API uses, so the client maps one shape.
export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  headers?: Record<string, string>,
): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status, headers });
}
