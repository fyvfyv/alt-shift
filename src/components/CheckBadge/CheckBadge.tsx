import CheckBadgeSvg from '../../assets/icons/check-badge.svg?react';

// Decorative: the counter next to it already says "5/5".
export function CheckBadge() {
  return <CheckBadgeSvg aria-hidden focusable={false} />;
}
