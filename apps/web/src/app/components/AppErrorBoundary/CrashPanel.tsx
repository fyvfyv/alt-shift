import { Button } from '@components/Button/Button';
import { EmptyPanel } from '@components/EmptyPanel/EmptyPanel';
import { PageTitle } from '@components/PageTitle/PageTitle';
import { copy } from '@copy';
import { announceCrash } from './announceCrash';

export function CrashPanel() {
  return (
    <>
      <PageTitle ref={announceCrash} size="lg">
        {copy.crash.title}
      </PageTitle>
      <div role="alert">
        <EmptyPanel
          text={copy.crash.text}
          action={
            <Button to="/" reloadDocument size="md">
              {copy.crash.action}
            </Button>
          }
        />
      </div>
    </>
  );
}
