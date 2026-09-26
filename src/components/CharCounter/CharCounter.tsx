import { copy } from '../../copy';
import controls from '../../styles/controls.module.css';
import typography from '../../styles/typography.module.css';

export function CharCounter({ id, count, limit }: { id: string; count: number; limit: number }) {
  return (
    <p
      id={id}
      className={`${controls.message} ${typography.sm}`}
      data-error={count > limit || undefined}
    >
      {copy.generator.charCounter(count, limit)}
    </p>
  );
}
