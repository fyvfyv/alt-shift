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
    // Swaps the label for a spinner (the label stays for screen readers) and ignores clicks.
    // Not `disabled`: focus stays on the button, so keyboard users are not dropped at the top
    // of the page when a run starts, and aria-disabled tells them why nothing happens.
    loading?: boolean;
  };

// Navigation that looks like a button is still a link: same classes, rendered as <a>.
type AsLink = OwnProps & Omit<ComponentProps<typeof Link>, keyof OwnProps> & { loading?: never };

type ButtonProps = AsButton | AsLink;

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
  const large = variant !== 'tertiary' && size === 'xl';
  const iconSize = large ? 24 : 20;
  const shared = {
    className: [styles.button, large ? typography.lgStrong : typography.mdStrong, className]
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
      <Link {...rest} {...shared}>
        {content}
      </Link>
    );
  }

  // A caller's aria-disabled only paints and announces the state: the click still fires (a submit
  // still submits), so the page can say what is missing. Only `loading` swallows it.
  const { type = 'button', onClick, 'aria-disabled': ariaDisabled, ...buttonProps } = rest;
  return (
    <button
      {...buttonProps}
      {...shared}
      type={type}
      aria-disabled={loading || ariaDisabled || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        // preventDefault also stops a submit button from submitting its form.
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
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
