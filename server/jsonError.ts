type ErrorCode =
  | 'invalid_request'
  | 'invalid_token'
  | 'rate_limit_exceeded'
  | 'upstream_error'
  | 'method_not_allowed'
  | 'forbidden';

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  headers?: Record<string, string>,
): Response {
  const body: ApiErrorBody = { error: { code, message } };
  return Response.json(body, { status, headers });
}
