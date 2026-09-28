import type { ComponentProps, ReactNode } from 'react';
import type { Link } from 'react-router';
import type { IconName, IconSize } from '@components/Icon/types';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export type ButtonSize = 'xl' | 'md';

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeading?: IconName;
  iconTrailing?: IconName;
  children: ReactNode;
};

type AsButton = OwnProps &
  Omit<ComponentProps<'button'>, keyof OwnProps> & {
    to?: never;
    // Not `disabled`: disabling the focused button drops keyboard focus to the page.
    loading?: boolean;
  };

type AsLink = OwnProps & Omit<ComponentProps<typeof Link>, keyof OwnProps> & { loading?: never };

export type ButtonProps = AsButton | AsLink;

export type ButtonContentProps = Pick<OwnProps, 'iconLeading' | 'iconTrailing' | 'children'> & {
  iconSize: IconSize;
  loading: boolean;
};
