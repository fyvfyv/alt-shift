import { useEffect, useState } from 'react';

// Measured against Date.now(): background tabs throttle timers.
export function useElapsed(active: boolean): number {
  const [seconds, setSeconds] = useState(0);

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
  }, [active]);

  return active ? seconds : 0;
}
