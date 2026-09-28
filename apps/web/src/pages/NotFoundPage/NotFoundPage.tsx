import { Button } from '@components/Button/Button';
import { EmptyPanel } from '@components/EmptyPanel/EmptyPanel';
import { PageTitle } from '@components/PageTitle/PageTitle';
import { copy } from '@copy';
import { useHeadingFocus } from '@hooks/useHeadingFocus';

export function NotFoundPage() {
  useHeadingFocus();
  return (
    <>
      <PageTitle size="lg">{copy.notFound.title}</PageTitle>
      <EmptyPanel
        text={copy.notFound.text}
        action={
          <Button to="/" size="md">
            {copy.notFound.action}
          </Button>
        }
      />
    </>
  );
}
