import type { ReactNode, Ref } from 'react';
import typography from '../../styles/typography.module.css';
import styles from './PageTitle.module.css';

type PageTitleProps = {
  children: ReactNode;
  // `md` on the generator, `lg` on the dashboard.
  size?: 'md' | 'lg';
  // Muted color while the title stands in for content the user hasn't entered yet.
  placeholder?: boolean;
  action?: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
};

// The h1 takes programmatic focus on route change (usePageMeta), never Tab focus.
export function PageTitle({
  children,
  size = 'md',
  placeholder = false,
  action,
  ref,
}: PageTitleProps) {
  const role = size === 'lg' ? typography.displayLg : typography.displayMd;
  return (
    <div className={styles.row} data-size={size}>
      <h1
        ref={ref}
        className={`${styles.title} ${role}`}
        data-placeholder={placeholder || undefined}
        tabIndex={-1}
        // The md title can be cut with an ellipsis; the tooltip shows it whole.
        title={size === 'md' && typeof children === 'string' ? children : undefined}
      >
        {children}
      </h1>
      {action}
    </div>
  );
}
