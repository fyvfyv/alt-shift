import styles from './ShimmerText.module.css';

export function ShimmerText({ children }: { children: string }) {
  // Keyed on the text, so every new message is revealed again.
  return (
    <span key={children} className={styles.shimmer}>
      {children}
    </span>
  );
}
