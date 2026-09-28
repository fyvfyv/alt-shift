import { generateRequestSchema } from '@alt-shift/shared/generation';
import { useCountdown } from '@hooks/useCountdown';
import { useOnline } from '@hooks/useOnline';
import { retryAtOf } from '../session/derive';
import { useLetterOnScreen } from './useLetterOnScreen';
import { useValues } from './useValues';

// Generate and the panel's Retry need a valid form, a connection, and a rate limit waited out.
export function useCanGenerate() {
  const { preview } = useLetterOnScreen();
  const retryCountdown = useCountdown(retryAtOf(preview));
  const online = useOnline();
  const valid = generateRequestSchema.safeParse(useValues()).success;
  return { canGenerate: valid && online && retryCountdown === 0, retryCountdown };
}
