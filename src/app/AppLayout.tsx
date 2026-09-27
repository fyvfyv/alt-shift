import { Outlet, useLocation } from 'react-router';
import { AppErrorBoundary } from './AppErrorBoundary';
import { PageShell } from './PageShell';

// The boundary sits inside the chrome: a page crash leaves the header, and its way home, in place.
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
