import { cx } from 'class-variance-authority';
import { Button } from '@components/Button/Button';
import { CopyButton } from '@components/CopyButton/CopyButton';
import { StorageNote } from '@components/StorageNote/StorageNote';
import { copy } from '@copy';
import { useStorageFailed } from '@hooks/useLetterStore';
import { useProfile } from '@hooks/useProfile';
import { endsOnSignOff } from '@services/letters/model';
import typography from '@styles/typography.module.css';
import { useGeneratorSession } from '../../hooks/useGeneratorSession';
import { SignatureField } from '../SignatureField/SignatureField';
import styles from './LetterPreview.module.css';

type LetterFooterProps = {
  // As written, to tell whether it ends on a bare closing that takes the name.
  letter: string;
  // As shown and copied, signed.
  text: string;
  offerNextCompany: boolean;
  onCopied: () => void;
};

export function LetterFooter({ letter, text, offerNextCompany, onCopied }: LetterFooterProps) {
  const session = useGeneratorSession();
  const name = useProfile((profile) => profile.name);
  const updateProfile = useProfile((profile) => profile.update);
  const storageFailed = useStorageFailed();
  const signable = endsOnSignOff(letter);
  return (
    <div className={styles.footer}>
      <div className={cx(styles.actions, !signable && styles.copyOnly)}>
        {signable && (
          <SignatureField name={name} onChange={(next) => updateProfile({ name: next })} />
        )}
        <CopyButton text={text} onCopied={onCopied} />
      </div>
      <StorageNote failed={storageFailed} align="end" />
      {offerNextCompany && (
        <div className={styles.nextCompany}>
          <p className={cx(styles.keptNote, typography.sm)}>{copy.preview.nextCompany.prompt}</p>
          <Button variant="secondary" size="md" onClick={session.nextCompany}>
            {copy.preview.nextCompany.action}
          </Button>
        </div>
      )}
    </div>
  );
}
