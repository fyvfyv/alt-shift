import { cva } from 'class-variance-authority';
import typography from '@styles/typography.module.css';
import styles from './LetterBody.module.css';
import { paragraphsOf } from './paragraphs';

type LetterBodyProps = {
  text: string;
  spacing: 'compact' | 'comfortable';
  className?: string;
};

const bodyVariants = cva([styles.body, typography.lg], {
  variants: {
    spacing: { compact: styles.compact, comfortable: styles.comfortable },
  },
});

export function LetterBody({ text, spacing, className }: LetterBodyProps) {
  return (
    <div className={bodyVariants({ spacing, className })}>
      {paragraphsOf(text).map((paragraph, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs have no identity; while streaming only the last one grows
        <p key={index} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
