import type { FunctionComponent, SVGProps } from 'react';
import Copy03 from '../../assets/icons/copy-03.svg?react';
import Home02 from '../../assets/icons/home-02.svg?react';
import Loading02 from '../../assets/icons/loading-02.svg?react';
import Plus from '../../assets/icons/plus.svg?react';
import Repeat03 from '../../assets/icons/repeat-03.svg?react';
import Trash01 from '../../assets/icons/trash-01.svg?react';

// Strokes are `currentColor`: an icon always takes the color of the text next to it. Stroke widths
// scale with the viewBox, so one file serves both sizes (2 at 24px renders as 1.667 at 20px).
const icons = {
  'copy-03': Copy03,
  'home-02': Home02,
  'loading-02': Loading02,
  plus: Plus,
  'repeat-03': Repeat03,
  'trash-01': Trash01,
} satisfies Record<string, FunctionComponent<SVGProps<SVGSVGElement>>>;

export type IconName = keyof typeof icons;
export type IconSize = 20 | 24;

type IconProps = {
  name: IconName;
  size?: IconSize;
  className?: string;
};

// Decorative by default: every icon sits next to a label or inside a control with an aria-label.
export function Icon({ name, size = 20, className }: IconProps) {
  const Svg = icons[name];
  return <Svg width={size} height={size} className={className} aria-hidden focusable={false} />;
}
