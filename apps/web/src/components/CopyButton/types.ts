import type { Ref } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

export type CopyButtonProps = {
  ref?: Ref<HTMLButtonElement>;
  text: string;
  onCopied?: () => void;
};

export type ClipboardCopy = {
  status: CopyStatus;
  copyText: () => Promise<void>;
};
