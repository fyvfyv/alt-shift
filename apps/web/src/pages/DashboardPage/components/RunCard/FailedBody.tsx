import { errorCopy } from '@copy';
import type { Run } from '@services/generation/types';
import { RunStatus } from './RunStatus';
import { failureOf } from './runView';

export function FailedBody({ run }: { run: Run }) {
  const failure = failureOf(run.state);
  if (!failure) return null;
  const { title, body } = errorCopy(failure);
  return <RunStatus run={run}>{`${title}. ${body}`}</RunStatus>;
}
