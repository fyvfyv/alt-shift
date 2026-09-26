import typography from '../../styles/typography.module.css';
import styles from './LetterBody.module.css';

type LetterBodyProps = {
  text: string;
  paragraphGap: 18 | 28;
  className?: string;
};

export function LetterBody({ text, paragraphGap, className }: LetterBodyProps) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '');
  return (
    <div
      className={[styles.body, typography.lg, className].filter(Boolean).join(' ')}
      data-gap={paragraphGap}
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
