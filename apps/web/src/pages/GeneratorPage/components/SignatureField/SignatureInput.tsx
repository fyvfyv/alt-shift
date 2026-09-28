import { LIMITS } from '@alt-shift/shared/generation';
import type { KeyboardEventHandler } from 'react';
import { TextField } from '@components/TextField/TextField';
import { copy } from '@copy';
import styles from './SignatureField.module.css';

type SignatureInputProps = {
  draft: string;
  onDraftChange: (draft: string) => void;
  onSave: () => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
};

export function SignatureInput({ draft, onDraftChange, onSave, onKeyDown }: SignatureInputProps) {
  return (
    <div className={styles.editor}>
      <TextField
        label={copy.signature.label}
        hideLabel
        placeholder={copy.signature.label}
        value={draft}
        maxLength={LIMITS.singleLine}
        autoComplete="name"
        autoFocus
        onChange={(event) => onDraftChange(event.target.value)}
        onBlur={onSave}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
