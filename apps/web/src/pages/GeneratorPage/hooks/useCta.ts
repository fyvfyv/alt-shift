import { ctaOf, hasLetter } from '../session/derive';
import type { CtaKind } from '../session/types';
import { useGeneratorStore } from './useGeneratorSession';
import { useLetterOnScreen } from './useLetterOnScreen';

export function useCta(): CtaKind {
  const { preview, savedLetter } = useLetterOnScreen();
  const hasCandidate = useGeneratorStore((state) => state.visit.candidateId !== null);
  return ctaOf(preview, hasCandidate && (hasLetter(preview) || savedLetter !== undefined));
}
