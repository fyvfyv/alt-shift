import utilities from '@styles/utilities.module.css';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';
import { statusMessage } from '../LetterPreview/previewStatus';

// The page's one announcement of a run; the preview is not a live region.
export function StatusLine() {
  const { preview, savedLetter } = useLetterOnScreen();
  return (
    <p role="status" className={utilities.visuallyHidden}>
      {statusMessage(preview, savedLetter !== undefined)}
    </p>
  );
}
