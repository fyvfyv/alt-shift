import type * as z from 'zod/mini';
import type { generateRequestSchema } from './generation';

export type GenerateRequest = z.output<typeof generateRequestSchema>;
