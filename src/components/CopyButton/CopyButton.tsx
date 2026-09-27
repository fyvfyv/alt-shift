import { useEffect, useState } from 'react';
import { copy } from '../../copy';
import utilities from '../../styles/utilities.module.css';
import { Button } from '../Button/Button';

const FEEDBACK_MS = 2000;

type Status = 'idle' | 'copied' | 'failed';

const labels: Record<Status, string> = {
  idle: copy.letter.copy,
  copied: copy.letter.copied,
  failed: copy.letter.copyFailed,
};

export function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <>
      <Button variant="tertiary" iconTrailing="copy-03" onClick={handleClick}>
        {labels[status]}
      </Button>
      <span className={utilities.visuallyHidden} aria-live="polite">
        {status === 'idle' ? '' : labels[status]}
      </span>
    </>
  );
}
