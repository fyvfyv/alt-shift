import { cva } from 'class-variance-authority';
import { ShimmerText } from '@components/ShimmerText/ShimmerText';
import typography from '@styles/typography.module.css';
import styles from './StatusChip.module.css';
import type { StatusChipProps } from './types';

const chipVariants = cva([styles.chip, typography.smMedium], {
  variants: { live: { true: styles.live } },
});

export function StatusChip({ id, children, live = false, className }: StatusChipProps) {
  return (
    <p id={id} className={chipVariants({ live, className })}>
      {live ? <ShimmerText reveal={false}>{children}</ShimmerText> : children}
    </p>
  );
}
