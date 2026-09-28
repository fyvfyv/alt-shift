import { useRef } from 'react';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import { SignatureInput } from './SignatureInput';
import type { SignatureFieldProps } from './types';
import { useSignatureEditor } from './useSignatureEditor';

export function SignatureField(props: SignatureFieldProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { editing, draft, open, setDraft, save, keyDown } = useSignatureEditor(props, buttonRef);
  if (editing) {
    return (
      <SignatureInput draft={draft} onDraftChange={setDraft} onSave={save} onKeyDown={keyDown} />
    );
  }
  return (
    <Button ref={buttonRef} variant="tertiary" onClick={open}>
      {props.name === '' ? copy.signature.add : copy.signature.change}
    </Button>
  );
}
