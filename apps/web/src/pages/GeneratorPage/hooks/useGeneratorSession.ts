import { useContext } from 'react';
import { useStore } from 'zustand';
import type { GeneratorSession } from '../session/GeneratorSession';
import { GeneratorSessionContext } from '../session/GeneratorSessionProvider';
import type { GeneratorState } from '../session/types';

// The session itself, for its actions.
export function useGeneratorSession(): GeneratorSession {
  const session = useContext(GeneratorSessionContext);
  if (!session) {
    throw new Error('useGeneratorSession must be used inside <GeneratorSessionProvider>');
  }
  return session;
}

// Select stable references or primitives only: a new object per call re-renders forever.
export function useGeneratorStore<T>(selector: (state: GeneratorState) => T): T {
  return useStore(useGeneratorSession().store, selector);
}
