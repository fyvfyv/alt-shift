import type { ReactNode } from 'react';
import { AppHeader } from '../AppHeader/AppHeader';
import styles from './PageShell.module.css';

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.page}>
        <AppHeader />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
