import type { ReactNode, Ref } from 'react';
import typography from '../../styles/typography.module.css';
import styles from './PageTitle.module.css';

type PageTitleProps = {
  children: ReactNode;
  size?: 'md' | 'lg';
  placeholder?: boolean;
  action?: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
};

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
        title={size === 'md' && typeof children === 'string' ? children : undefined}
      >
        {children}
      </h1>
      {action}
    </div>
  );
}
