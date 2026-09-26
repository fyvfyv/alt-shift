import { usePageMeta } from '../../app/usePageMeta';
import { PageShell } from '../../components/PageShell/PageShell';
import { PageTitle } from '../../components/PageTitle/PageTitle';
import { copy } from '../../copy';

export function GeneratorPage() {
  usePageMeta(copy.generator.title);
  return (
    <PageShell>
      <PageTitle placeholder>{copy.generator.title}</PageTitle>
    </PageShell>
  );
}
