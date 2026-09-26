import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { PageShell } from '../../components/PageShell/PageShell';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { copy } from '../../copy';

export function DashboardPage() {
  usePageMeta(copy.dashboard.title);
  return (
    <PageShell>
      <PageTitle
        size="lg"
        action={
          <Button to="/new" size="md" iconLeading="plus">
            {copy.createNew}
          </Button>
        }
      >
        {copy.dashboard.title}
      </PageTitle>
    </PageShell>
  );
}
