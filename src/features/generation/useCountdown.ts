import { useEffect, useState } from 'react';

// Counts against Date.now(): background tabs throttle timers.
export function useCountdown(seconds: number, key: unknown): number {
  const [left, setLeft] = useState(seconds);
  const [startedFor, setStartedFor] = useState(key);
  if (key !== startedFor) {
    setStartedFor(key);
    setLeft(seconds);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the restart trigger
  useEffect(() => {
    if (seconds <= 0) return;
    const endsAt = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(next);
      if (next === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [seconds, key]);

  return left;
}
