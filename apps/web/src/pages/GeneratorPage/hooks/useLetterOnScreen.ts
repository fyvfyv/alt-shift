import { useGenerationQueue } from '@hooks/useGenerationQueue';
import { useLetterStore } from '@hooks/useLetterStore';
import { previewOf } from '../session/derive';
import type { LetterOnScreen } from '../session/types';
import { useGeneratorStore } from './useGeneratorSession';

export function useLetterOnScreen(): LetterOnScreen {
  const runId = useGeneratorStore((state) => state.visit.runId);
  const run = useGenerationQueue((s) => s.runs.find((r) => r.id === runId));
  const savedLetter = useLetterStore((s) => s.letters.find((l) => l.id === runId)?.text);
  return { run, savedLetter, preview: previewOf(run, savedLetter) };
}
