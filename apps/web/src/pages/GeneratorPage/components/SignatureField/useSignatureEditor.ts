import { type KeyboardEvent, type RefObject, useLayoutEffect, useRef, useState } from 'react';
import type { SignatureFieldProps } from './types';

// Enter saves and Escape drops the draft, both handing focus back to the button; leaving saves.
export function useSignatureEditor(
  { name, onChange }: SignatureFieldProps,
  buttonRef: RefObject<HTMLButtonElement | null>,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  // The blur the field's unmount fires must not save again (after Escape it would save the draft).
  const closed = useRef(false);
  const refocus = useRef(false);

  // The button is back once the editor has closed.
  useLayoutEffect(() => {
    if (editing || !refocus.current) return;
    refocus.current = false;
    buttonRef.current?.focus();
  }, [editing, buttonRef]);

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

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    event.preventDefault();
    refocus.current = true;
    close(event.key === 'Enter');
  }

  return { editing, draft, open, setDraft, save: () => close(true), keyDown };
}
