import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import buttonStyles from '../Button/Button.module.css';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

type OwnProps = {
  icon: IconName;
  // Required: the icon is the only content.
  'aria-label': string;
};

type AsButton = OwnProps &
  Omit<ComponentProps<'button'>, keyof OwnProps | 'children'> & { to?: never };
type AsLink = OwnProps & Omit<ComponentProps<typeof Link>, keyof OwnProps | 'children'>;

export type IconButtonProps = AsButton | AsLink;

export function IconButton({ icon, className, ...rest }: IconButtonProps) {
  const shared = {
    className: [buttonStyles.button, styles.iconButton, className].filter(Boolean).join(' '),
    'data-variant': 'secondary',
  };
  const content = <Icon name={icon} size={20} />;

  if (rest.to !== undefined) {
    return (
      <Link {...(rest as Omit<AsLink, 'icon'>)} {...shared}>
        {content}
      </Link>
    );
  }
  const { type = 'button', ...buttonProps } = rest as Omit<AsButton, 'icon'>;
  return (
    <button {...buttonProps} {...shared} type={type}>
      {content}
    </button>
  );
}
