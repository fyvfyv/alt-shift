import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import utilities from '@styles/utilities.module.css';
import type { CopyButtonProps, CopyStatus } from './types';
import { useClipboardCopy } from './useClipboardCopy';

const labels: Record<CopyStatus, string> = {
  idle: copy.letter.copy,
  copied: copy.letter.copied,
  failed: copy.letter.copyFailed,
};

export function CopyButton({ ref, text, onCopied }: CopyButtonProps) {
  const { status, copyText } = useClipboardCopy(text, onCopied);
  return (
    <>
      <Button ref={ref} variant="tertiary" iconTrailing="copy-03" onClick={copyText}>
        {labels[status]}
      </Button>
      <span className={utilities.visuallyHidden} aria-live="polite">
        {status === 'idle' ? '' : labels[status]}
      </span>
    </>
  );
}
