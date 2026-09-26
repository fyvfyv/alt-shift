import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { GenerateRequest } from '../../../shared/generation';
import { GenerationFailure } from './errors';
import { useGenerationPort } from './GenerationProvider';
import { generationReducer, initialPreviewState } from './generationReducer';

// Deltas are batched into one render per animation frame; a new run, `abort()` or unmounting
// cancels the one in flight.
export function useGeneration() {
  const port = useGenerationPort();
  const [state, dispatch] = useReducer(generationReducer, initialPreviewState);
  const controller = useRef<AbortController | null>(null);
  const pendingText = useRef('');
  const frame = useRef<number | null>(null);

  const cancelFrame = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const flush = useCallback(() => {
    cancelFrame();
    if (pendingText.current === '') return;
    dispatch({ type: 'delta', text: pendingText.current });
    pendingText.current = '';
  }, [cancelFrame]);

  const cancelRun = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    cancelFrame();
    pendingText.current = '';
  }, [cancelFrame]);

  // Resolves with the full letter once the stream completes cleanly; with undefined when it
  // fails (the state then holds the error) or is aborted.
  const generate = useCallback(
    async (request: GenerateRequest): Promise<string | undefined> => {
      cancelRun();
      const run = new AbortController();
      controller.current = run;
      dispatch({ type: 'start' });

      let text = '';
      try {
        for await (const delta of port(request, run.signal)) {
          if (run.signal.aborted) return;
          text += delta;
          pendingText.current += delta;
          frame.current ??= requestAnimationFrame(flush);
        }
      } catch (e) {
        if (run.signal.aborted) return;
        // Whatever the last frame hasn't shown yet belongs before the error.
        flush();
        dispatch({
          type: 'error',
          error: e instanceof GenerationFailure ? e.error : { kind: 'upstream' },
        });
        return;
      }
      if (run.signal.aborted) return;
      flush();
      dispatch({ type: 'done' });
      controller.current = null;
      return text === '' ? undefined : text;
    },
    [port, cancelRun, flush],
  );

  const abort = useCallback(() => {
    cancelRun();
    dispatch({ type: 'abort' });
  }, [cancelRun]);

  useEffect(() => cancelRun, [cancelRun]);

  return { state, generate, abort };
}
