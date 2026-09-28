import { useRef } from 'react';
import { Button } from '@components/Button/Button';
import { GoalBanner } from '@components/GoalBanner/GoalBanner';
import { PageTitle } from '@components/PageTitle/PageTitle';
import { StorageNote } from '@components/StorageNote/StorageNote';
import { copy } from '@copy';
import { useHeadingFocus } from '@hooks/useHeadingFocus';
import { useGeneratedCount, useStorageFailed } from '@hooks/useLetterStore';
import utilities from '@styles/utilities.module.css';
import { EmptyDashboard } from './components/EmptyDashboard/EmptyDashboard';
import { LetterGrid } from './components/LetterGrid/LetterGrid';
import styles from './DashboardPage.module.css';
import { useDashboardItems } from './hooks/useDashboardItems';
import { useRunAnnouncements } from './hooks/useRunAnnouncements';

export function DashboardPage() {
  useHeadingFocus();
  const items = useDashboardItems();
  const status = useRunAnnouncements();
  const count = useGeneratedCount();
  const storageFailed = useStorageFailed();
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <>
      <div className={styles.section}>
        <PageTitle
          ref={headingRef}
          size="lg"
          action={
            <Button to="/new" size="md" iconLeading="plus">
              {copy.createNew}
            </Button>
          }
        >
          {copy.dashboard.title}
        </PageTitle>
        <StorageNote failed={storageFailed} />
        {items.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <LetterGrid items={items} headingRef={headingRef} />
        )}
      </div>
      <p role="status" className={utilities.visuallyHidden}>
        {status}
      </p>
      <GoalBanner
        count={count}
        action={
          <Button to="/new" iconLeading="plus">
            {copy.createNew}
          </Button>
        }
      />
    </>
  );
}
