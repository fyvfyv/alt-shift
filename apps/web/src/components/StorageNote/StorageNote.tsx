import { cva } from 'class-variance-authority';
import { copy } from '@copy';
import typography from '@styles/typography.module.css';
import utilities from '@styles/utilities.module.css';
import styles from './StorageNote.module.css';

type StorageNoteProps = { failed: boolean; align?: 'start' | 'end' };

const noteVariants = cva(null, {
  variants: {
    failed: { true: [styles.note, typography.sm], false: utilities.visuallyHidden },
    align: { start: null, end: styles.end },
  },
});

// Always mounted: some screen readers skip a status inserted already holding its text.
export function StorageNote({ failed, align = 'start' }: StorageNoteProps) {
  return (
    <p role="status" className={noteVariants({ failed, align })}>
      {failed ? copy.storageNote : ''}
    </p>
  );
}
