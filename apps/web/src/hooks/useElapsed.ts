import { useEffect, useState } from 'react';

// Whole seconds since `since` last changed; `undefined` stops the count. Measured against
// Date.now(): background tabs throttle timers.
export function useElapsed(since: unknown): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (since === undefined) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => {
      clearInterval(timer);
      setSeconds(0);
    };
  }, [since]);

  return since === undefined ? 0 : seconds;
}
