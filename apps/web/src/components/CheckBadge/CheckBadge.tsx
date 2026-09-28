import CheckBadgeSvg from '@assets/icons/check-badge.svg?react';
import styles from './CheckBadge.module.css';

export function CheckBadge() {
  return <CheckBadgeSvg className={styles.badge} aria-hidden focusable={false} />;
}
