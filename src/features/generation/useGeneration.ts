import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { GenerateRequest } from '../../../shared/generation';
import { GenerationFailure } from './errors';
import { useGenerationPort } from './GenerationProvider';
import { generationReducer, initialPreviewState } from './generationReducer';

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
        // Flush first, or the cut letter loses its last unrendered deltas.
        flush();
        if (!(e instanceof GenerationFailure)) console.error('[generation]', e);
        dispatch({
          type: 'error',
          error: e instanceof GenerationFailure ? e.error : { kind: 'upstream' },
        });
        return;
      } finally {
        // A newer run may own the ref by now.
        if (controller.current === run) controller.current = null;
      }
      if (run.signal.aborted) return;
      flush();
      dispatch({ type: 'done' });
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
