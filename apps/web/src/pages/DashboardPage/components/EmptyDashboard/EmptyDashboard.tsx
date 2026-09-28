import { Button } from '@components/Button/Button';
import { EmptyPanel } from '@components/EmptyPanel/EmptyPanel';
import { copy } from '@copy';

// The first visit pitches the product and offers a letter without typing.
export function EmptyDashboard() {
  return (
    <EmptyPanel
      heading={copy.dashboard.pitch}
      text={copy.dashboard.empty}
      note={copy.dashboard.trust}
      action={
        <Button variant="secondary" size="md" to="/new" state={{ prefill: copy.example.request }}>
          {copy.example.label}
        </Button>
      }
    />
  );
}
