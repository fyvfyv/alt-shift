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

const SIGN_OFF = /^(sincerely|best regards|kind regards|regards|best|yours),?$/i;

// The model often stops on a bare sign-off; the name goes under it, and nowhere else.
export function withSignature(text: string, name: string): string {
  const signature = name.trim();
  if (signature === '') return text;
  const lastLine = text.split('\n').findLast((line) => line.trim() !== '');
  if (lastLine === undefined || !SIGN_OFF.test(lastLine.trim())) return text;
  return `${text.trimEnd()}\n${signature}`;
}
