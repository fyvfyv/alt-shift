import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import { Icon, type IconName } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'xl' | 'md';

type OwnProps = {
  variant?: ButtonVariant;
  // Ignored by `tertiary`, which has no box.
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeading?: IconName;
  iconTrailing?: IconName;
  children: ReactNode;
};

type AsButton = OwnProps &
  Omit<ComponentProps<'button'>, keyof OwnProps> & {
    to?: never;
    // Disables the button and swaps the label for a spinner; the label stays for screen readers.
    loading?: boolean;
  };

// Navigation that looks like a button is still a link: same classes, rendered as <a>.
type AsLink = OwnProps & Omit<ComponentProps<typeof Link>, keyof OwnProps> & { loading?: never };

export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'xl',
    fullWidth = false,
    iconLeading,
    iconTrailing,
    loading = false,
    className,
    children,
    ...rest
  } = props;
  const iconSize = variant !== 'tertiary' && size === 'xl' ? 24 : 20;
  const shared = {
    className: [
      styles.button,
      iconSize === 24 ? typography.lgStrong : typography.mdStrong,
      className,
    ]
      .filter(Boolean)
      .join(' '),
    'data-variant': variant,
    'data-size': variant === 'tertiary' ? undefined : size,
    'data-full-width': fullWidth || undefined,
  };
  const content = (
    <>
      {iconLeading && <Icon name={iconLeading} size={iconSize} />}
      {children}
      {iconTrailing && <Icon name={iconTrailing} size={iconSize} />}
    </>
  );

  if (rest.to !== undefined) {
    return (
      <Link {...(rest as Omit<AsLink, keyof OwnProps>)} {...shared}>
        {content}
      </Link>
    );
  }

  const { type = 'button', disabled, ...buttonProps } = rest as Omit<AsButton, keyof OwnProps>;
  return (
    <button
      {...buttonProps}
      {...shared}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <Spinner size={iconSize} />
          <span className={utilities.visuallyHidden}>{children}</span>
        </>
      ) : (
        content
      )}
    </button>
  );
}
