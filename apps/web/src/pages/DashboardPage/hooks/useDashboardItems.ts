import { useGenerationQueue } from '@hooks/useGenerationQueue';
import { useLetterStore } from '@hooks/useLetterStore';
import { listItems } from '../dashboardItems';

export function useDashboardItems() {
  const letters = useLetterStore((s) => s.letters);
  const runs = useGenerationQueue((s) => s.runs);
  return listItems(letters, runs);
}
