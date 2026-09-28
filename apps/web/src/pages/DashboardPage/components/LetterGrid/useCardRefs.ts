import { useContext } from 'react';
import { CardFocusContext } from './CardFocusContext';

// The refs a card hands to the grid for its first footer button and its Copy.
export function useCardRefs(id: string) {
  const focus = useContext(CardFocusContext);
  return { firstButton: focus?.firstButton(id), copyButton: focus?.copyButton(id) };
}
