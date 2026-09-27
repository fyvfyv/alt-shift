import Copy03 from '../../assets/icons/copy-03.svg?react';
import Home02 from '../../assets/icons/home-02.svg?react';
import Loading02 from '../../assets/icons/loading-02.svg?react';
import Plus from '../../assets/icons/plus.svg?react';
import Repeat03 from '../../assets/icons/repeat-03.svg?react';
import Trash01 from '../../assets/icons/trash-01.svg?react';

const icons = {
  'copy-03': Copy03,
  'home-02': Home02,
  'loading-02': Loading02,
  plus: Plus,
  'repeat-03': Repeat03,
  'trash-01': Trash01,
};

export type IconName = keyof typeof icons;
export type IconSize = 20 | 24;

type IconProps = {
  name: IconName;
  size: IconSize;
};

export function Icon({ name, size }: IconProps) {
  const Svg = icons[name];
  return <Svg width={size} height={size} aria-hidden focusable={false} />;
}
