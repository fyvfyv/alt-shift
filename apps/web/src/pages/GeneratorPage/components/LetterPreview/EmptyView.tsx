import { cx } from 'class-variance-authority';
import { Button } from '@components/Button/Button';
import { copy } from '@copy';
import { useGenerationQueue } from '@hooks/useGenerationQueue';
import { isPending } from '@services/generation/selectors';
import typography from '@styles/typography.module.css';
import { useGeneratorStore } from '../../hooks/useGeneratorSession';
import styles from './LetterPreview.module.css';

// Says so when another letter is still being written, so a return here doesn't start it twice.
export function EmptyView() {
  const runId = useGeneratorStore((state) => state.visit.runId);
  const runs = useGenerationQueue((s) => s.runs);
  const elsewhere = runs
    .filter((run) => run.id !== runId && isPending(run.state))
    .map((run) => run.request.company);
  const [first] = elsewhere;
  if (first === undefined) {
    return <p className={cx(styles.placeholder, typography.lg)}>{copy.preview.empty}</p>;
  }
  return (
    <div className={styles.elsewhere}>
      <p className={cx(styles.placeholder, typography.lg)}>
        {copy.preview.elsewhere(elsewhere.length, first)}
      </p>
      <Button variant="tertiary" to="/">
        {copy.preview.elsewhereLink(elsewhere.length)}
      </Button>
    </div>
  );
}
