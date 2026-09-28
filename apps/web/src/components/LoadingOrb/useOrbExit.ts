import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@utils/device';

// Matches the 250ms transition on .orb in LoadingOrb.module.css.
const ORB_EXIT_MS = 250;

export function useOrbExit(loading: boolean): boolean {
  const [wasLoading, setWasLoading] = useState(loading);
  const [exiting, setExiting] = useState(false);
  if (loading !== wasLoading) {
    setWasLoading(loading);
    setExiting(!loading && !prefersReducedMotion());
  }

  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(() => setExiting(false), ORB_EXIT_MS);
    return () => clearTimeout(timer);
  }, [exiting]);

  return exiting;
}
