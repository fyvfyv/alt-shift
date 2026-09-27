import styles from './ShimmerText.module.css';

export function ShimmerText({ children, reveal = true }: { children: string; reveal?: boolean }) {
  // Keyed on the text, so every new message is revealed again.
  return (
    <span key={children} className={styles.shimmer} data-reveal={reveal || undefined}>
      {children}
    </span>
  );
}
