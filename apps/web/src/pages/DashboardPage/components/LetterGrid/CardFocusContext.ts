import { createContext } from 'react';
import type { CardFocus } from './CardFocus';

// Cards find the grid's focus bookkeeping here; a card rendered on its own (a test, a story) has none.
export const CardFocusContext = createContext<CardFocus | null>(null);
