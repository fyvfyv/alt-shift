import type { ReactNode, Ref } from 'react';
import type { StatusChipProps } from '@components/StatusChip/types';

export type CardProps = {
  label: string;
  // The card's chip describes it; pass the chip's id when there is one.
  chipId?: string;
  writing?: boolean;
  // Lets the dashboard's focus bookkeeping find a card for a letter still on its way.
  runId?: string;
  children: ReactNode;
};

export type CardBodyProps = {
  ref?: Ref<HTMLDivElement>;
  scrolled?: boolean;
  cut?: boolean;
  children: ReactNode;
};

export type CardChipProps = Omit<StatusChipProps, 'className'>;
