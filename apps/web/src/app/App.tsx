import { Route, Routes } from 'react-router';
import { DashboardPage } from '@pages/DashboardPage/DashboardPage';
import { GeneratorPage } from '@pages/GeneratorPage/GeneratorPage';
import { NotFoundPage } from '@pages/NotFoundPage/NotFoundPage';
import { AppLayout } from './AppLayout';
import { useLeaveWarning } from './hooks/useLeaveWarning';
import { useScrollToTop } from './hooks/useScrollToTop';

export function App() {
  useLeaveWarning();
  useScrollToTop();
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="new" element={<GeneratorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
