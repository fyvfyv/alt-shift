import type { Letter, NewLetter } from './types';
export const GOAL = 5;

export function createLetter({
  id = crypto.randomUUID(),
  createdAt = Date.now(),
  jobTitle,
  company,
  text,
}: NewLetter): Letter {
  return { id, createdAt, jobTitle, company, text };
}

const SIGN_OFF =
  /^(sincerely( yours)?|yours( sincerely| truly)?|(best|kind|warm) regards|regards|best( wishes)?),?$/i;
const SENTENCE_END = /[.!?…]["'”’)]*$/;

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function wordCount(line: string): number {
  return line.split(/\s+/).length;
}

// `index >= 2`: the greeting also ends in a comma.
function isClosing(lines: readonly string[], index: number): boolean {
  const line = lines[index];
  if (line === undefined) return false;
  return SIGN_OFF.test(line) || (index >= 2 && line.endsWith(',') && wordCount(line) <= 4);
}

export function endsOnSignOff(text: string): boolean {
  const lines = linesOf(text);
  return isClosing(lines, lines.length - 1);
}

// Every live-API cut stopped mid-sentence. Lean towards whole: a false cut fails on every retry.
export function looksWhole(text: string): boolean {
  const lines = linesOf(text);
  const last = lines.length - 1;
  const lastLine = lines[last];
  if (lastLine === undefined || last === 0) return false;
  const signedClosing = isClosing(lines, last - 1) && wordCount(lastLine) <= 4;
  return isClosing(lines, last) || signedClosing || SENTENCE_END.test(lastLine);
}

export function withSignature(text: string, name: string): string {
  const signature = name.trim();
  if (signature === '' || !endsOnSignOff(text)) return text;
  return `${text.trimEnd()}\n${signature}`;
}
