// The mini build: this ships to the browser, where full zod would add four times the weight.
import * as z from 'zod/mini';
import type { GenerateRequest } from './types';

export const LIMITS = { details: 1200, singleLine: 300 } as const;

export const EMPTY_REQUEST: GenerateRequest = {
  jobTitle: '',
  company: '',
  skills: '',
  details: '',
};

// Code points, not UTF-16 units: an emoji counts as one character.
export function countChars(value: string): number {
  let count = 0;
  for (const _ of value) count++;
  return count;
}

// A line break would add an instruction line to the system prompt; a pasted tab is harmless.
const SINGLE_LINE = /^(?:\t|\P{Cc})*$/u;

// Trimmed first, so the limit counts what is sent.
function text(limit: number) {
  return z
    .string({ error: (issue) => (issue.input === undefined ? 'Required.' : 'Must be text.') })
    .check(
      z.trim(),
      z.refine((value) => countChars(value) <= limit, {
        error: `Must be at most ${limit} characters.`,
      }),
    );
}

const singleLine = text(LIMITS.singleLine).check(
  z.minLength(1, { error: 'Required.' }),
  z.regex(SINGLE_LINE, { error: 'Must be a single line.' }),
);

// The one rule for what may be sent: the form checks it before Generate, the server on arrival.
export const generateRequestSchema = z.object(
  {
    jobTitle: singleLine,
    company: singleLine,
    skills: singleLine,
    details: z._default(text(LIMITS.details), ''),
  },
  { error: 'Must be a JSON object.' },
);
