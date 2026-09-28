import type { Run } from '@services/generation/types';
import type { Letter } from '@services/letters/types';

type Listed = { id: string; createdAt: number };

// `rewrite`: the run writing a new version of a saved letter.
type LetterItem = Listed & { letter: Letter; rewrite?: Run };

type RunItem = Listed & { run: Run };

export type DashboardItem = LetterItem | RunItem;
