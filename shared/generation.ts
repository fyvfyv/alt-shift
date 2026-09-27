// Shared by the form and the /api/generate proxy, so the form never submits what the server rejects.

export type GenerateRequest = {
  jobTitle: string;
  company: string;
  skills: string;
  details: string;
};

export const LIMITS = { details: 1200, singleLine: 300 } as const;

export const EMPTY_REQUEST: GenerateRequest = {
  jobTitle: '',
  company: '',
  skills: '',
  details: '',
};

export type ErrorCode =
  | 'invalid_request'
  | 'invalid_token'
  | 'rate_limit_exceeded'
  | 'upstream_error'
  | 'method_not_allowed'
  | 'forbidden';

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };

type ValidationResult = { ok: true; value: GenerateRequest } | { ok: false; message: string };

// Code points, not UTF-16 units: an emoji counts as one character, matching what the user sees.
export function countChars(value: string): number {
  let count = 0;
  for (const _ of value) count++;
  return count;
}

const SINGLE_LINE_FIELDS = ['jobTitle', 'company', 'skills'] as const;

function invalid(message: string): ValidationResult {
  return { ok: false, message };
}

export function validateGenerateRequest(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return invalid('Request body must be a JSON object.');
  }
  const body = input as Record<string, unknown>;
  const value: GenerateRequest = { ...EMPTY_REQUEST };

  for (const field of SINGLE_LINE_FIELDS) {
    const raw = body[field];
    if (typeof raw !== 'string' || raw.trim() === '') {
      return invalid(`${field} is required.`);
    }
    value[field] = raw.trim();
    if (countChars(value[field]) > LIMITS.singleLine) {
      return invalid(`${field} must be at most ${LIMITS.singleLine} characters.`);
    }
  }

  const details = body.details ?? '';
  if (typeof details !== 'string') {
    return invalid('details must be a string.');
  }
  value.details = details.trim();
  if (countChars(value.details) > LIMITS.details) {
    return invalid(`details must be at most ${LIMITS.details} characters.`);
  }

  return { ok: true, value };
}
