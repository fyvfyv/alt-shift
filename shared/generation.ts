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

type ValidationResult = { ok: true; value: GenerateRequest } | { ok: false; message: string };

// Code points, not UTF-16 units: an emoji counts as one character.
export function countChars(value: string): number {
  let count = 0;
  for (const _ of value) count++;
  return count;
}

const SINGLE_LINE_FIELDS = ['jobTitle', 'company', 'skills'] as const;

// A line break would add an instruction line to the system prompt; a pasted tab is harmless.
const CONTROL_EXCEPT_TAB = /(?!\t)\p{Cc}/u;

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
    if (CONTROL_EXCEPT_TAB.test(value[field])) {
      return invalid(`${field} must be a single line.`);
    }
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
