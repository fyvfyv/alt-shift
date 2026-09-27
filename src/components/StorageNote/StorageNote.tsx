import { copy } from '../../copy';
import typography from '../../styles/typography.module.css';
import styles from './StorageNote.module.css';

type StorageNoteProps = { align?: 'start' | 'end' };

export function StorageNote({ align = 'start' }: StorageNoteProps) {
  return (
    <p className={`${styles.note} ${typography.sm}`} data-align={align}>
      {copy.storageNote}
    </p>
  );
}
