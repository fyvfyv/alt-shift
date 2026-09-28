import type { Letter } from '@services/letters/types';

// A new version on its way; the letter stays usable until it replaces it.
export type LetterCardStatus = {
  label: string;
  writing: boolean;
};

export type LetterCardProps = {
  letter: Letter;
  signature?: string;
  onDelete: () => void;
  status?: LetterCardStatus;
};
