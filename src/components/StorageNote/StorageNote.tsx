import { copy } from '../../copy';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';
import styles from './StorageNote.module.css';

type StorageNoteProps = { failed: boolean; align?: 'start' | 'end' };

// Always mounted: some screen readers skip a status inserted already holding its text.
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
