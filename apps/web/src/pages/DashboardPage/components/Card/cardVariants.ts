import { cva } from 'class-variance-authority';
import utilities from '@styles/utilities.module.css';
import styles from './Card.module.css';

export const cardVariants = cva([styles.card, utilities.sheen], {
  variants: { chip: { true: styles.withChip } },
});

export const cardBodyVariants = cva(styles.body, {
  variants: { scrolled: { true: styles.scrolled }, cut: { true: styles.cut } },
});
