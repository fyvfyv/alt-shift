import { type MouseEvent, type PointerEvent, type RefObject, useEffect, useRef } from 'react';

// Opens the dialog as a modal on mount. A click on its backdrop reaches the dialog itself, not one
// of its children, and closes it; so must the press that began it, or releasing a text selection
// outside the dialog would close it too.
export function useModalDialog(dialogRef: RefObject<HTMLDialogElement | null>) {
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [dialogRef]);

  return {
    close: () => dialogRef.current?.close(),
    trackPress: (event: PointerEvent<HTMLDialogElement>) => {
      pressedOnBackdrop.current = event.target === event.currentTarget;
    },
    closeOnBackdrop: (event: MouseEvent<HTMLDialogElement>) => {
      if (pressedOnBackdrop.current && event.target === event.currentTarget) {
        event.currentTarget.close();
      }
    },
  };
}
