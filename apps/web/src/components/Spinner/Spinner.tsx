import { Icon } from '@components/Icon/Icon';
import type { IconSize } from '@components/Icon/types';
import styles from './Spinner.module.css';

export function Spinner({ size = 24 }: { size?: IconSize }) {
  return (
    <span className={styles.spinner} data-motion="essential">
      <Icon name="loading-02" size={size} />
    </span>
  );
}
