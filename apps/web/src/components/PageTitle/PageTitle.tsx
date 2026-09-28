import { cva } from 'class-variance-authority';
import type { ReactNode, Ref } from 'react';
import { copy } from '@copy';
import typography from '@styles/typography.module.css';
import styles from './PageTitle.module.css';

type PageTitleProps = {
  children: string;
  size?: 'md' | 'lg';
  placeholder?: boolean;
  action?: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
};

const rowVariants = cva(styles.row, {
  variants: { size: { md: styles.md, lg: styles.lg } },
});

const titleVariants = cva(styles.title, {
  variants: {
    size: { md: typography.displayMd, lg: typography.displayLg },
    placeholder: { true: styles.placeholder },
  },
});

export function PageTitle({
  children,
  size = 'md',
  placeholder = false,
  action,
  ref,
}: PageTitleProps) {
  return (
    <div className={rowVariants({ size })}>
      {/* React moves it into <head>: the tab is named after the page's heading. */}
      <title>{copy.documentTitle(children)}</title>
      <h1
        ref={ref}
        className={titleVariants({ size, placeholder })}
        tabIndex={-1}
        title={size === 'md' ? children : undefined}
      >
        {children}
      </h1>
      {action}
    </div>
  );
}
