import { Icon, type IconSize } from '../Icon/Icon';
import styles from './Spinner.module.css';

export function Spinner({ size = 24 }: { size?: IconSize }) {
  return (
    <span className={styles.spinner} data-motion="essential">
      <Icon name="loading-02" size={size} />
    </span>
  );
}
