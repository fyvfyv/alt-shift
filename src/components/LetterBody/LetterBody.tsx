import typography from '../../styles/typography.module.css';
import styles from './LetterBody.module.css';

type LetterBodyProps = {
  text: string;
  spacing: 'compact' | 'comfortable';
  className?: string;
};

export function LetterBody({ text, spacing, className }: LetterBodyProps) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '');
  return (
    <div
      className={[styles.body, typography.lg, className].filter(Boolean).join(' ')}
      data-spacing={spacing}
    >
      {paragraphs.map((paragraph, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs have no identity; while streaming only the last one grows
        <p key={index} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
