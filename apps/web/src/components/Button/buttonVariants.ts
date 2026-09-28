import { cva } from 'class-variance-authority';
import type { IconSize } from '@components/Icon/types';
import typography from '@styles/typography.module.css';
import styles from './Button.module.css';
import type { ButtonSize, ButtonVariant } from './types';

export const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      primary: styles.primary,
      secondary: styles.secondary,
      tertiary: [styles.tertiary, typography.mdStrong],
    },
    // Only boxed variants take a size (the compounds below): a tertiary button is bare text.
    size: { xl: null, md: null },
    fullWidth: { true: styles.fullWidth },
  },
  compoundVariants: [
    { variant: ['primary', 'secondary'], size: 'xl', className: [styles.xl, typography.lgStrong] },
    { variant: ['primary', 'secondary'], size: 'md', className: [styles.md, typography.mdStrong] },
  ],
});

export function iconSizeOf(variant: ButtonVariant, size: ButtonSize): IconSize {
  return variant !== 'tertiary' && size === 'xl' ? 24 : 20;
}
