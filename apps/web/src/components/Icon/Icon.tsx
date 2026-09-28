import { icons } from './icons';
import type { IconProps } from './types';

export function Icon({ name, size }: IconProps) {
  const Svg = icons[name];
  return <Svg width={size} height={size} aria-hidden focusable={false} />;
}
