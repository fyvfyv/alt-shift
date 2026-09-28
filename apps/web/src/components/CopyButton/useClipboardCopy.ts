import { useEffect, useState } from 'react';
import { writeClipboard } from '@utils/clipboard';
import type { ClipboardCopy, CopyStatus } from './types';

const FEEDBACK_MS = 2000;

export function useClipboardCopy(text: string, onCopied?: () => void): ClipboardCopy {
  const [status, setStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const copyText = async () => {
    const copied = await writeClipboard(text);
    setStatus(copied ? 'copied' : 'failed');
    if (copied) onCopied?.();
  };

  return { status, copyText };
}
