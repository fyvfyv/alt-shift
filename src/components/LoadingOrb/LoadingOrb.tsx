import { useEffect, useState } from 'react';
import styles from './LoadingOrb.module.css';

// Matches the 250ms transition on .orb in LoadingOrb.module.css.
const ORB_EXIT_MS = 250;

export function LoadingOrb({ exiting = false }: { exiting?: boolean }) {
  return (
    <div className={styles.orb} data-exiting={exiting || undefined} aria-hidden>
      <div className={styles.breathe} data-motion="essential">
        <div className={styles.glow} />
        <div className={styles.ball} />
      </div>
    </div>
  );
}

export function useOrbExit(loading: boolean): boolean {
  const [wasLoading, setWasLoading] = useState(loading);
  const [exiting, setExiting] = useState(false);
  if (loading !== wasLoading) {
    setWasLoading(loading);
    setExiting(!loading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  useEffect(() => {
    if (!exiting) return;
    const timer = setTimeout(() => setExiting(false), ORB_EXIT_MS);
    return () => clearTimeout(timer);
  }, [exiting]);

  return exiting;
}
