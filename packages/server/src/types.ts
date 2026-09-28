export type ErrorCode =
  | 'invalid_request'
  | 'invalid_token'
  | 'rate_limit_exceeded'
  | 'upstream_error'
  | 'method_not_allowed'
  | 'forbidden';

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };
