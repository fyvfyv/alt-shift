import type { GenerateRequest } from '@alt-shift/shared/types';
import type { StoreApi } from 'zustand/vanilla';

export type Profile = Pick<GenerateRequest, 'skills' | 'details'> & { name: string };

export type ProfileState = Profile & {
  update(patch: Partial<Profile>): void;
};

export type ProfileStore = StoreApi<ProfileState>;
