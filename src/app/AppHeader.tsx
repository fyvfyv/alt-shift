import { IconButton } from '../components/IconButton/IconButton';
import { Logo } from '../components/Logo/Logo';
import { ProgressCounter } from '../components/ProgressCounter/ProgressCounter';
import { copy } from '../copy';
import { useGeneratedCount } from '../features/letters/LetterStoreProvider';
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
