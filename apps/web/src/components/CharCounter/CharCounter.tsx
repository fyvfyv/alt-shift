import { cx } from 'class-variance-authority';
import { copy } from '@copy';
import controls from '@styles/controls.module.css';
import typography from '@styles/typography.module.css';
import utilities from '@styles/utilities.module.css';
import { useOverLimitAnnouncement } from './useOverLimitAnnouncement';

type CharCounterProps = { id: string; count: number; limit: number };

// Not a live region: it would speak on every keystroke. The status below speaks only when the
// limit is crossed.
export function CharCounter({ id, count, limit }: CharCounterProps) {
  const announcement = useOverLimitAnnouncement(count, limit);
  return (
    <>
      <p
        id={id}
        className={cx(controls.message, typography.sm)}
        data-error={count > limit || undefined}
      >
        {copy.generator.charCounter(count, limit)}
      </p>
      <p role="status" className={utilities.visuallyHidden}>
        {announcement}
      </p>
    </>
  );
}
