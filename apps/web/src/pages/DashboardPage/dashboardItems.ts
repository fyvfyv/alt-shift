import { copy } from '@copy';
import { isPending } from '@services/generation/selectors';
import type { Run } from '@services/generation/types';
import type { Letter } from '@services/letters/types';
import type { DashboardItem } from './types';

// Saved letters, plus the ones not saved yet that are on their way or failed; newest first.
export function listItems(letters: Letter[], runs: Run[]): DashboardItem[] {
  const byId = new Map(runs.map((run) => [run.id, run]));
  const saved = new Set(letters.map((letter) => letter.id));
  const items: DashboardItem[] = letters.map((letter) => {
    const run = byId.get(letter.id);
    const rewrite = run && isPending(run.state) ? run : undefined;
    return { id: letter.id, createdAt: letter.createdAt, letter, rewrite };
  });
  // Newest asked first, so letters asked for in the same millisecond still list newest first.
  for (const run of runs.toReversed()) {
    const onItsWay = isPending(run.state) || run.state.status === 'error';
    if (!saved.has(run.id) && onItsWay) items.push({ id: run.id, createdAt: run.createdAt, run });
  }
  return items.toSorted((a, b) => b.createdAt - a.createdAt);
}

export function newVersionStatus(run: Run) {
  const queued = run.state.status === 'queued';
  return {
    label: queued ? copy.queue.newVersion.queued : copy.queue.newVersion.writing,
    writing: !queued,
  };
}

// What a run that just finished means to someone who can't see its card.
export function announcement(run: Run, wasSaved: boolean): string | undefined {
  const title = copy.letter.title(run.request.jobTitle, run.request.company);
  const { state } = run;
  if (state.status === 'completed') return copy.queue.announce.ready(title);
  if (state.status !== 'error') return undefined;
  if (wasSaved) return copy.queue.announce.keptFailed(title);
  return state.error.kind === 'stream-cut'
    ? copy.queue.announce.cut(title)
    : copy.queue.announce.failed(title);
}
