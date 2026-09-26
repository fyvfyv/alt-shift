import { useEffect, useRef } from 'react';
import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { EmptyPanel } from '../../components/EmptyPanel/EmptyPanel';
import { GoalBanner } from '../../components/GoalBanner/GoalBanner';
import { PageShell } from '../../components/PageShell/PageShell';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { copy } from '../../copy';
import { useLetterStore } from '../../features/letters/LetterStoreProvider';
import typography from '../../styles/typography.module.css';
import styles from './DashboardPage.module.css';
import { LetterCard } from './LetterCard';

export function DashboardPage() {
  usePageMeta(copy.dashboard.title);
  const letters = useLetterStore((s) => s.letters);
  const remove = useLetterStore((s) => s.remove);
  const storageFailed = useLetterStore((s) => s.lastStorageError !== null);

  // A deleted card takes its focused button with it. Focus moves to the card that slides into its
  // place, or to the page title when there is none, after the commit that removed it.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterDelete = useRef<(() => void) | null>(null);

  useEffect(() => {
    focusAfterDelete.current?.();
    focusAfterDelete.current = null;
  });

  function handleDelete(id: string, index: number) {
    const next = letters[index + 1];
    focusAfterDelete.current = next
      ? () => deleteButtons.current.get(next.id)?.focus()
      : () => titleRef.current?.focus();
    void remove(id);
  }

  const createNew = (
    <Button to="/new" size="md" iconLeading="plus">
      {copy.createNew}
    </Button>
  );

  return (
    <PageShell>
      <div className={styles.section}>
        <PageTitle ref={titleRef} size="lg" action={createNew}>
          {copy.dashboard.title}
        </PageTitle>
        {storageFailed && (
          <p className={`${styles.storageNote} ${typography.sm}`}>{copy.storageNote}</p>
        )}
        {letters.length === 0 ? (
          <EmptyPanel text={copy.dashboard.empty} action={createNew} />
        ) : (
          <div className={styles.grid}>
            {letters.map((letter, index) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onDelete={() => handleDelete(letter.id, index)}
                deleteRef={(button) => {
                  if (!button) return;
                  deleteButtons.current.set(letter.id, button);
                  return () => void deleteButtons.current.delete(letter.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
      <GoalBanner
        count={letters.length}
        action={
          <Button to="/new" iconLeading="plus">
            {copy.createNew}
          </Button>
        }
      />
    </PageShell>
  );
}
