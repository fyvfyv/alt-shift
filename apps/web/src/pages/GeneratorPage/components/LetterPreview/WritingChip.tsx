import { StatusChip } from '@components/StatusChip/StatusChip';
import { copy } from '@copy';
import { useStalled } from '@hooks/useStalled';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import styles from './LetterPreview.module.css';

export function WritingChip() {
  const { preview } = useLetterOnScreen();
  const stalled = useStalled(preview.status === 'streaming' ? preview.text : undefined);
  return (
    <StatusChip live className={styles.writing}>
      {stalled ? copy.preview.streaming.stalled : copy.preview.streaming.writing}
    </StatusChip>
  );
}
