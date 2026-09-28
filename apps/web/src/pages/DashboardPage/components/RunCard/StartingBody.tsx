import { ShimmerText } from '@components/ShimmerText/ShimmerText';
import { copy } from '@copy';
import type { Run } from '@services/generation/types';
import { RunStatus } from './RunStatus';

export function StartingBody({ run }: { run: Run }) {
  return (
    <RunStatus run={run}>
      <ShimmerText>{copy.preview.loading.writing(run.request.company)}</ShimmerText>
    </RunStatus>
  );
}
