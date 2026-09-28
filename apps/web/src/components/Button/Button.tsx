import { Link } from 'react-router';
import { ButtonContent } from './ButtonContent';
import { buttonVariants, iconSizeOf } from './buttonVariants';
import { clickUnlessLoading } from './clickGuard';
import type { ButtonProps } from './types';

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
  const classes = buttonVariants({ variant, size, fullWidth, className });
  const content = (
    <ButtonContent
      iconLeading={iconLeading}
      iconTrailing={iconTrailing}
      iconSize={iconSizeOf(variant, size)}
      loading={loading}
    >
      {children}
    </ButtonContent>
  );

  if (rest.to !== undefined) {
    return (
      <Link {...rest} className={classes}>
        {content}
      </Link>
    );
  }

  // A caller's aria-disabled still fires the click, so the page can say what is missing.
  const { type = 'button', onClick, 'aria-disabled': ariaDisabled, ...buttonProps } = rest;
  return (
    <button
      {...buttonProps}
      className={classes}
      type={type}
      aria-disabled={loading || ariaDisabled || undefined}
      aria-busy={loading || undefined}
      onClick={clickUnlessLoading(loading, onClick)}
    >
      {content}
    </button>
  );
}
