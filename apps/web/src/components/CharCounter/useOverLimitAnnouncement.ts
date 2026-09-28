import { useState } from 'react';
import { copy } from '@copy';

// Set only when the count crosses the limit: a status speaks whenever its text changes.
export function useOverLimitAnnouncement(count: number, limit: number): string {
  const over = count > limit;
  const [announcement, setAnnouncement] = useState(() => ({ over, text: '' }));
  if (announcement.over !== over) {
    setAnnouncement({ over, text: over ? copy.generator.overLimit(count - limit) : '' });
  }
  return announcement.text;
}
