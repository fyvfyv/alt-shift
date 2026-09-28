import { Icon } from '@components/Icon/Icon';
import { Spinner } from '@components/Spinner/Spinner';
import utilities from '@styles/utilities.module.css';
import type { ButtonContentProps } from './types';

export function ButtonContent({
  iconLeading,
  iconTrailing,
  iconSize,
  loading,
  children,
}: ButtonContentProps) {
  // The label stays as the accessible name while the spinner stands in for it on screen.
  if (loading) {
    return (
      <>
        <Spinner size={iconSize} />
        <span className={utilities.visuallyHidden}>{children}</span>
      </>
    );
  }
  return (
    <>
      {iconLeading && <Icon name={iconLeading} size={iconSize} />}
      {children}
      {iconTrailing && <Icon name={iconTrailing} size={iconSize} />}
    </>
  );
}
