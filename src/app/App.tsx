import { Route, Routes } from 'react-router';
import { DashboardPage } from '../pages/DashboardPage/DashboardPage';
import { GeneratorPage } from '../pages/GeneratorPage/GeneratorPage';
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage';
import { AppLayout } from './AppLayout';
import { ScrollToTop } from './ScrollToTop';

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="new" element={<GeneratorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
