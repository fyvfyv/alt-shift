import type { ReactNode } from 'react';

export type AppErrorBoundaryProps = {
  children: ReactNode;
  resetKey?: string;
};

export type AppErrorBoundaryState = { crashed: boolean };
