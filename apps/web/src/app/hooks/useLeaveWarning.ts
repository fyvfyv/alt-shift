import { useEffect } from 'react';
import { useGenerationQueue } from '@hooks/useGenerationQueue';
import { isPending } from '@services/generation/selectors';

// Letters on their way live in this tab only. The browser shows its own words; phones may not ask.
export function useLeaveWarning() {
  const pending = useGenerationQueue((s) => s.runs.some((run) => isPending(run.state)));

  useEffect(() => {
    if (!pending) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older Chrome and Safari ask only when returnValue is set.
      event.returnValue = true;
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending]);
}
