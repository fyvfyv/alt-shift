import { createContext, type ReactNode, useContext } from 'react';
import type { GenerationPort } from './generationClient';

const GenerationContext = createContext<GenerationPort | null>(null);

export function GenerationProvider({
  port,
  children,
}: {
  port: GenerationPort;
  children: ReactNode;
}) {
  return <GenerationContext value={port}>{children}</GenerationContext>;
}

export function useGenerationPort(): GenerationPort {
  const port = useContext(GenerationContext);
  if (!port) throw new Error('useGenerationPort must be used inside <GenerationProvider>');
  return port;
}
