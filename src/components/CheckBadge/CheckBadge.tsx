import CheckBadgeSvg from '../../assets/icons/check-badge.svg?react';
import styles from './CheckBadge.module.css';

// Decorative: the counter next to it already says "5/5".
export function CheckBadge() {
  return <CheckBadgeSvg className={styles.badge} aria-hidden focusable={false} />;
}
