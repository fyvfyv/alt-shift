import type { ReactNode } from 'react';
import { AppHeader } from '../AppHeader/AppHeader';
import styles from './PageShell.module.css';

type PageShellProps = {
  children: ReactNode;
  // The crash fallback drops the header: it reads the store, which may be what failed.
  header?: boolean;
};

export function PageShell({ children, header = true }: PageShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.page}>
        {header && <AppHeader />}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
