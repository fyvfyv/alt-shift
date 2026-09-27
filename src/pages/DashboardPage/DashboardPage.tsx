import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { EmptyPanel } from '../../components/EmptyPanel/EmptyPanel';
import { GoalBanner } from '../../components/GoalBanner/GoalBanner';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { StorageNote } from '../../components/StorageNote/StorageNote';
import { copy } from '../../copy';
import { useProfile } from '../../features/generation/useGeneratorFields';
import { useLetterStore, useStorageFailed } from '../../features/letters/LetterStoreProvider';
import styles from './DashboardPage.module.css';
import { LetterCard } from './LetterCard';

export function DashboardPage() {
  usePageMeta(copy.dashboard.title);
  const letters = useLetterStore((s) => s.letters);
  const remove = useLetterStore((s) => s.remove);
  const storageFailed = useStorageFailed();
  const { profile } = useProfile();

  const titleRef = useRef<HTMLHeadingElement>(null);
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());

  // A deleted card takes its focused button with it. The removal is committed before focus moves
  // to the card that slides into its place, or to the page title when there is none.
  function handleDelete(id: string, index: number) {
    const next = letters[index + 1];
    flushSync(() => void remove(id));
    const nextDelete = next ? deleteButtons.current.get(next.id) : undefined;
    (nextDelete ?? titleRef.current)?.focus();
  }

  const createNew = (
    <Button to="/new" size="md" iconLeading="plus">
      {copy.createNew}
    </Button>
  );

  return (
    <>
      <div className={styles.section}>
        <PageTitle ref={titleRef} size="lg" action={createNew}>
          {copy.dashboard.title}
        </PageTitle>
        {storageFailed && <StorageNote />}
        {letters.length === 0 ? (
          <EmptyPanel
            text={copy.dashboard.empty}
            action={
              <>
                {createNew}
                <Button variant="tertiary" to="/new" state={{ prefill: copy.example.request }}>
                  {copy.example.label}
                </Button>
              </>
            }
          />
        ) : (
          <div className={styles.grid}>
            {letters.map((letter, index) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                signature={profile.name}
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
    </>
  );
}
