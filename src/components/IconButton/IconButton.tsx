import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import buttonStyles from '../Button/Button.module.css';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ComponentProps<typeof Link>, 'children'> & {
  icon: IconName;
  // Required: the icon is the only content.
  'aria-label': string;
};

export function IconButton({ icon, className, ...rest }: IconButtonProps) {
  return (
    <Link
      {...rest}
      className={[buttonStyles.button, styles.iconButton, className].filter(Boolean).join(' ')}
      data-variant="secondary"
    >
      <Icon name={icon} size={20} />
    </Link>
  );
}
