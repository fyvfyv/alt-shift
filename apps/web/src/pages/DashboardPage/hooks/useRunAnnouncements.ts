import { useEffect, useState } from 'react';
import { useQueue } from '@hooks/useGenerationQueue';
import { useLetterStoreApi } from '@hooks/useLetterStore';
import { isPending } from '@services/generation/selectors';
import { announcement } from '../dashboardItems';

// Cards are not live regions, so one status line says what finished while the page was open.
export function useRunAnnouncements(): string {
  const queue = useQueue();
  const letters = useLetterStoreApi();
  const [status, setStatus] = useState('');

  useEffect(
    () =>
      queue.store.subscribe(({ runs }, previous) => {
        const before = new Map(previous.runs.map((run) => [run.key, run.state]));
        for (const run of runs) {
          const was = before.get(run.key);
          if (!was || !isPending(was) || isPending(run.state)) continue;
          const wasSaved = letters.getState().letters.some((letter) => letter.id === run.id);
          const message = announcement(run, wasSaved);
          if (message) setStatus(message);
        }
      }),
    [queue, letters],
  );

  return status;
}
