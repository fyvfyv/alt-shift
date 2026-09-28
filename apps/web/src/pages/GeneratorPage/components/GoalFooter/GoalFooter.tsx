import { Button } from '@components/Button/Button';
import { GoalBanner } from '@components/GoalBanner/GoalBanner';
import { copy } from '@copy';
import { useGeneratedCount } from '@hooks/useLetterStore';
import { keptLetter } from '@services/generation/selectors';
import { useGeneratorSession } from '../../hooks/useGeneratorSession';
import { useLetterOnScreen } from '../../hooks/useLetterOnScreen';

// The goal banner shows once a letter is on screen, with Create New to start the next one.
export function GoalFooter() {
  const session = useGeneratorSession();
  const { preview, savedLetter } = useLetterOnScreen();
  const count = useGeneratedCount();
  if (keptLetter(preview, savedLetter) === undefined) return null;
  const createNew = (
    <Button iconLeading="plus" onClick={session.startNew}>
      {copy.createNew}
    </Button>
  );
  return <GoalBanner count={count} action={createNew} reachedAction={createNew} />;
}
