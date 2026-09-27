import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { TextField } from '../../components/TextField/TextField';
import { copy } from '../../copy';
import styles from './SignatureField.module.css';

const NAME_MAX_LENGTH = 80;

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
  const restoreFocus = useRef(false);

  // Closing from the keyboard returns focus to the button; a click elsewhere keeps its target.
  useEffect(() => {
    if (editing || !restoreFocus.current) return;
    restoreFocus.current = false;
    buttonRef.current?.focus();
  }, [editing]);

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
    restoreFocus.current = true;
    close(event.key === 'Enter');
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
        value={draft}
        maxLength={NAME_MAX_LENGTH}
        autoComplete="name"
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => close(true)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
