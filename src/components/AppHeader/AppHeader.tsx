import { copy } from '../../copy';
import { useGeneratedCount } from '../../features/letters/LetterStoreProvider';
import { IconButton } from '../IconButton/IconButton';
import { Logo } from '../Logo/Logo';
import { ProgressCounter } from '../ProgressCounter/ProgressCounter';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const count = useGeneratedCount();
  return (
    <header className={styles.header}>
      <Logo />
      <div className={styles.cluster}>
        <ProgressCounter count={count} />
        <IconButton icon="home-02" to="/" aria-label={copy.header.homeLabel} />
      </div>
    </header>
  );
}
