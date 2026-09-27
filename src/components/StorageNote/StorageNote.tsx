import { copy } from '../../copy';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import styles from './StorageNote.module.css';

type StorageNoteProps = { failed: boolean; align?: 'start' | 'end' };

// Render it whether or not storage failed: a status is announced when its text changes, and one
// inserted already holding the text is skipped by some screen readers. Until then it is off screen
// and empty, so it takes no room in the layout around it.
export function StorageNote({ failed, align = 'start' }: StorageNoteProps) {
  return (
    <p
      role="status"
      className={failed ? `${styles.note} ${typography.sm}` : utilities.visuallyHidden}
      data-align={align}
    >
      {failed ? copy.storageNote : ''}
    </p>
  );
}
