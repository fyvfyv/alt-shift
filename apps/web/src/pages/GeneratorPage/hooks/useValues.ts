import type { GenerateRequest } from '@alt-shift/shared/types';
import { useProfile } from '@hooks/useProfile';
import { requestOf } from '../session/derive';
import { useGeneratorStore } from './useGeneratorSession';

export function useValues(): GenerateRequest {
  const job = useGeneratorStore((state) => state.job);
  const fill = useGeneratorStore((state) => state.fill);
  const skills = useProfile((profile) => profile.skills);
  const details = useProfile((profile) => profile.details);
  return requestOf({ job, fill }, { skills, details });
}
