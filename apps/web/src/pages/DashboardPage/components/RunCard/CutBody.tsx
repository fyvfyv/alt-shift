import { cx } from 'class-variance-authority';
import { LetterBody } from '@components/LetterBody/LetterBody';
import { copy } from '@copy';
import typography from '@styles/typography.module.css';
import styles from './RunCard.module.css';

export function CutBody({ text }: { text: string }) {
  return (
    <>
      <p className={cx(styles.cutNote, typography.sm)}>{copy.preview.streamCut}</p>
      <LetterBody text={text} spacing="compact" />
    </>
  );
}
