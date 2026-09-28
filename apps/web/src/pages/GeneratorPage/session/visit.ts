import { createReducer } from '@utils/reducer';
import type { Visit, VisitEvents } from './types';

export const visitReducer = createReducer<Visit, VisitEvents>({
  generate: (visit, { id }) => ({
    ...visit,
    candidateId: id,
    runId: id,
    beforeRun: { candidateId: visit.candidateId, runId: visit.runId },
  }),
  cancel: (visit) => ({
    ...visit,
    candidateId: visit.beforeRun?.candidateId ?? null,
    runId: visit.beforeRun?.runId ?? null,
  }),
  edit: (visit) => ({ ...visit, candidateId: null }),
  reset: () => ({ candidateId: null, runId: null, beforeRun: null }),
  written: (visit, { title }) => ({ ...visit, shownTitle: title }),
});
