import { type RefObject, useState } from 'react';

// The letter opened whole in a dialog; closing it hands focus back to what opened it.
export function useReader(openerRef: RefObject<HTMLButtonElement | null>) {
  const [reading, setReading] = useState(false);
  return {
    reading,
    open: () => setReading(true),
    close: () => {
      setReading(false);
      openerRef.current?.focus();
    },
  };
}
