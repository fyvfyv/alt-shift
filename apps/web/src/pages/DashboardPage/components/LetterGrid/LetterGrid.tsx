import type { RefObject } from 'react';
import { useGenerationQueue } from '@hooks/useGenerationQueue';
import { useLetterStore } from '@hooks/useLetterStore';
import { useProfile } from '@hooks/useProfile';
import type { Run } from '@services/generation/types';
import { newVersionStatus } from '../../dashboardItems';
import type { DashboardItem } from '../../types';
import { LetterCard } from '../LetterCard/LetterCard';
import { RunCard } from '../RunCard/RunCard';
import { CardFocusContext } from './CardFocusContext';
import styles from './LetterGrid.module.css';
import { useCardFocus } from './useCardFocus';

type LetterGridProps = {
  items: DashboardItem[];
  headingRef: RefObject<HTMLHeadingElement | null>;
};

export function LetterGrid({ items, headingRef }: LetterGridProps) {
  const focus = useCardFocus(items, headingRef);
  const removeLetter = useLetterStore((s) => s.remove);
  const enqueue = useGenerationQueue((s) => s.enqueue);
  const removeRun = useGenerationQueue((s) => s.remove);
  const signature = useProfile((s) => s.name);

  const removeAt = (index: number, remove: () => void) => {
    focus.afterRemoval(items[index + 1]?.id);
    remove();
  };

  const retry = (run: Run) => {
    focus.toFirstButton(run.id);
    enqueue({ id: run.id, request: run.request });
  };

  return (
    <CardFocusContext value={focus}>
      <div className={styles.grid}>
        {items.map((item, index) =>
          'run' in item ? (
            <RunCard
              key={item.id}
              run={item.run}
              onRemove={() => removeAt(index, () => removeRun(item.id))}
              onRetry={() => retry(item.run)}
            />
          ) : (
            <LetterCard
              key={item.id}
              letter={item.letter}
              signature={signature}
              status={item.rewrite && newVersionStatus(item.rewrite)}
              onDelete={() => removeAt(index, () => void removeLetter(item.id))}
            />
          ),
        )}
      </div>
    </CardFocusContext>
  );
}
