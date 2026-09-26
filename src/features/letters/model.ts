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
