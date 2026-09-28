import { cva } from 'class-variance-authority';
import styles from './LoadingOrb.module.css';

const orbVariants = cva(styles.orb, {
  variants: { exiting: { true: styles.exiting } },
});

export function LoadingOrb({ exiting = false }: { exiting?: boolean }) {
  return (
    <div className={orbVariants({ exiting })} aria-hidden>
      <div className={styles.breathe} data-motion="essential">
        <div className={styles.glow} />
        <div className={styles.ball} />
      </div>
    </div>
  );
}
