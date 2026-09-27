import { useState } from 'react';
import { copy } from '../../copy';
import controls from '../../styles/controls.module.css';
import typography from '../../styles/typography.module.css';
import utilities from '../../styles/utilities.module.css';

type CharCounterProps = { id: string; count: number; limit: number };

// Not a live region: it would speak on every keystroke. The status below speaks only when the
// limit is crossed.
export function CharCounter({ id, count, limit }: CharCounterProps) {
  const over = count > limit;
  const [announcement, setAnnouncement] = useState(() => ({ over, text: '' }));
  if (announcement.over !== over) {
    setAnnouncement({ over, text: over ? copy.generator.overLimit(count - limit) : '' });
  }
  return (
    <>
      <p id={id} className={`${controls.message} ${typography.sm}`} data-error={over || undefined}>
        {copy.generator.charCounter(count, limit)}
      </p>
      <p role="status" className={utilities.visuallyHidden}>
        {announcement.text}
      </p>
    </>
  );
}
