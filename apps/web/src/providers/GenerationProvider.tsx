import { createContext, type ReactNode } from 'react';
import type { GenerationQueue } from '@services/generation/queue';

type GenerationProviderProps = { queue: GenerationQueue; children: ReactNode };

export const GenerationContext = createContext<GenerationQueue | null>(null);

export function GenerationProvider({ queue, children }: GenerationProviderProps) {
  return <GenerationContext value={queue}>{children}</GenerationContext>;
}
