export type Letter = {
  readonly id: string;
  readonly createdAt: number;
  readonly jobTitle: string;
  readonly company: string;
  readonly text: string;
};

export const GOAL = 5;

export function createLetter({
  id = crypto.randomUUID(),
  jobTitle,
  company,
  text,
}: {
  id?: string;
  jobTitle: string;
  company: string;
  text: string;
}): Letter {
  return { id, createdAt: Date.now(), jobTitle, company, text };
}

// The prompt asks for "Sincerely,"; the other common closings are here in case the model uses one
// instead, with or without the comma.
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

// A known sign-off, or any short line ending in a comma once the greeting and a paragraph are
// behind it, so "Warmly," and "З повагою," count too.
function isClosing(lines: readonly string[], index: number): boolean {
  const line = lines[index];
  if (line === undefined) return false;
  return SIGN_OFF.test(line) || (index >= 2 && line.endsWith(',') && wordCount(line) <= 4);
}

export function endsOnSignOff(text: string): boolean {
  const lines = linesOf(text);
  return isClosing(lines, lines.length - 1);
}

// Every letter the live API cut short yet closed cleanly stopped mid-sentence ("…user
// interfaces", "…scalable and"), while a whole letter ends on a closing, on a name under one, or
// at least on a finished sentence. Failing a whole letter costs more than saving a cut one: it
// would fail the same way on every retry.
export function looksWhole(text: string): boolean {
  const lines = linesOf(text);
  const last = lines.length - 1;
  const lastLine = lines[last];
  if (lastLine === undefined || last === 0) return false;
  const signedClosing = isClosing(lines, last - 1) && wordCount(lastLine) <= 4;
  return isClosing(lines, last) || signedClosing || SENTENCE_END.test(lastLine);
}

// The name goes under a closing, and nowhere else: a letter the model already signed keeps its own.
export function withSignature(text: string, name: string): string {
  const signature = name.trim();
  if (signature === '' || !endsOnSignOff(text)) return text;
  return `${text.trimEnd()}\n${signature}`;
}
