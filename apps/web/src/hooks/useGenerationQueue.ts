import { useContext } from 'react';
import { useStore } from 'zustand';
import { GenerationContext } from '@providers/GenerationProvider';
import type { GenerationQueue } from '@services/generation/queue';
import type { QueueState } from '@services/generation/types';

// The queue itself, for code that subscribes to its changes instead of rendering from them.
export function useQueue(): GenerationQueue {
  const queue = useContext(GenerationContext);
  if (!queue) throw new Error('useQueue must be used inside <GenerationProvider>');
  return queue;
}

// Select stable references or primitives only: a new array per call re-renders forever.
export function useGenerationQueue<T>(selector: (state: QueueState) => T): T {
  return useStore(useQueue().store, selector);
}
