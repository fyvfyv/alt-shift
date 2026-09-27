import { type KeyboardEvent, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { LIMITS } from '../../../shared/generation';
import { Button } from '../../components/Button/Button';
import { TextField } from '../../components/TextField/TextField';
import { copy } from '../../copy';
import styles from './SignatureField.module.css';

type SignatureFieldProps = {
  name: string;
  onChange: (name: string) => void;
};

export function SignatureField({ name, onChange }: SignatureFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The blur the field's unmount fires must not save again (after Escape it would save the draft).
  const closed = useRef(false);

  function open() {
    setDraft(name);
    closed.current = false;
    setEditing(true);
  }

  function close(save: boolean) {
    if (closed.current) return;
    closed.current = true;
    if (save) onChange(draft.trim());
    setEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    event.preventDefault();
    flushSync(() => close(event.key === 'Enter'));
    buttonRef.current?.focus();
  }

  if (!editing) {
    return (
      <Button ref={buttonRef} variant="tertiary" onClick={open}>
        {name === '' ? copy.signature.add : copy.signature.change}
      </Button>
    );
  }
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
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => close(true)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
