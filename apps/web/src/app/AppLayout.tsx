import { Outlet, useLocation } from 'react-router';
import { AppErrorBoundary } from './components/AppErrorBoundary/AppErrorBoundary';
import { PageShell } from './components/PageShell/PageShell';

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
