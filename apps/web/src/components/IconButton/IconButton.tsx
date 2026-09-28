import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { buttonVariants } from '@components/Button/buttonVariants';
import { Icon } from '@components/Icon/Icon';
import type { IconName } from '@components/Icon/types';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ComponentProps<typeof Link>, 'children'> & {
  icon: IconName;
  'aria-label': string;
};

export function IconButton({ icon, className, ...rest }: IconButtonProps) {
  return (
    <Link
      {...rest}
      className={buttonVariants({
        variant: 'secondary',
        className: [styles.iconButton, className],
      })}
    >
      <Icon name={icon} size={20} />
    </Link>
  );
}
