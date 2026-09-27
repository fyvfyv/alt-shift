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

// A button that opens into a one-line field: Enter or leaving it saves, Escape cancels.
export function SignatureField({ name, onChange }: SignatureFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Enter and Escape close the field themselves; the blur its unmount fires must not save again.
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

  // Closing from the keyboard returns focus to the button; a click elsewhere keeps its target.
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
  // The field replaces the button just clicked, so its label is spoken, not shown. The cap is the
  // form's single-line limit made hard: a field that saves on blur has nowhere to show an error.
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
