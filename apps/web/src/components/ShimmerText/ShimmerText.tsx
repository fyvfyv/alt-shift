import { cva } from 'class-variance-authority';
import styles from './ShimmerText.module.css';

const shimmerVariants = cva(styles.shimmer, {
  variants: { reveal: { true: styles.revealing } },
});

export function ShimmerText({ children, reveal = true }: { children: string; reveal?: boolean }) {
  // Keyed on the text, so every new message is revealed again.
  return (
    <span key={children} className={shimmerVariants({ reveal })}>
      {children}
    </span>
  );
}
