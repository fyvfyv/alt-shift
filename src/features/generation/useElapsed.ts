import { useEffect, useState } from 'react';

// Whole seconds since `active` became true, 0 while inactive. Ticks against the clock, so a
// throttled tab stays right.
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
