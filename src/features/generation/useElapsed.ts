import { useEffect, useState } from 'react';

// Measured against Date.now(): background tabs throttle timers.
export function useElapsed(active: boolean, since?: unknown): number {
  const [seconds, setSeconds] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `since` only restarts the count
  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => {
      clearInterval(timer);
      setSeconds(0);
    };
  }, [active, since]);

  return active ? seconds : 0;
}
