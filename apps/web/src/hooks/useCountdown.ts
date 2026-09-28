import { useEffect, useState } from 'react';

function secondsUntil(until: number): number {
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

// Counts to a deadline against Date.now(): background tabs throttle timers, and every view of
// one wait shows the same seconds.
export function useCountdown(until = 0): number {
  const [left, setLeft] = useState(() => secondsUntil(until));
  const [startedFor, setStartedFor] = useState(until);
  if (until !== startedFor) {
    setStartedFor(until);
    setLeft(secondsUntil(until));
  }

  useEffect(() => {
    if (secondsUntil(until) === 0) return;
    const timer = setInterval(() => {
      const next = secondsUntil(until);
      setLeft(next);
      if (next === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [until]);

  return left;
}
