import { Outlet, useLocation } from 'react-router';
import { PageShell } from '../components/PageShell/PageShell';
import { AppErrorBoundary } from './AppErrorBoundary';

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
