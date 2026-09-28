import type { icons } from './icons';

export type IconName = keyof typeof icons;

export type IconSize = 20 | 24;

export type IconProps = {
  name: IconName;
  size: IconSize;
};
