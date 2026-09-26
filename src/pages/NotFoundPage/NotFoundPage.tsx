import { usePageMeta } from '../../app/usePageMeta';
import { Button } from '../../components/Button/Button';
import { EmptyPanel } from '../../components/EmptyPanel/EmptyPanel';
import { PageShell } from '../../components/PageShell/PageShell';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { copy } from '../../copy';

export function NotFoundPage() {
  usePageMeta(copy.notFound.title);
  return (
    <PageShell>
      <PageTitle size="lg">{copy.notFound.title}</PageTitle>
      <EmptyPanel
        text={copy.notFound.text}
        action={
          <Button to="/" size="md">
            {copy.notFound.action}
          </Button>
        }
      />
    </PageShell>
  );
}
