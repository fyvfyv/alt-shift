import { Link } from 'react-router';
import LogoSvg from '@assets/logo.svg?react';
import { copy } from '@copy';
import styles from './Logo.module.css';

export function Logo() {
  return (
    <Link to="/" className={styles.logo} aria-label={copy.header.logoLabel}>
      <LogoSvg aria-hidden focusable={false} />
    </Link>
  );
}
