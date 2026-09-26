import { useEffect, useState } from 'react';
import { copy } from '../../copy';
import utilities from '../../styles/utilities.module.css';
import { Button } from '../Button/Button';

const COPIED_MS = 2000;

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access denied: the label simply doesn't change.
    }
  }

  return (
    <>
      <Button variant="tertiary" iconTrailing="copy-03" onClick={handleClick}>
        {copied ? copy.letter.copied : copy.letter.copy}
      </Button>
      <span className={utilities.visuallyHidden} aria-live="polite">
        {copied ? copy.letter.copied : ''}
      </span>
    </>
  );
}
