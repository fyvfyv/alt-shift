import { Outlet, useLocation } from 'react-router';
import { AppErrorBoundary } from './AppErrorBoundary';
import { PageShell } from './PageShell';

export function AppLayout() {
  const { key } = useLocation();
  return (
    <PageShell>
      <AppErrorBoundary resetKey={key}>
        <Outlet />
      </AppErrorBoundary>
    </PageShell>
  );
}
