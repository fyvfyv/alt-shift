import { copy } from '@copy';
import { GOAL } from '@services/letters/model';
import type { GoalPitch } from './types';

export function goalPitch(count: number): GoalPitch {
  if (count >= GOAL) return { title: copy.goal.reachedTitle, subtitle: copy.goal.reachedSubtitle };
  return { title: copy.goal.title, subtitle: copy.goal.subtitle(count, GOAL) };
}
