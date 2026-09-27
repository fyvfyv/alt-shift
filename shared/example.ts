import type { GenerateRequest } from './generation.js';

// The short mock fixture is recorded from this: re-run `pnpm record:fixture short` after a change.
export const EXAMPLE_REQUEST: GenerateRequest = {
  jobTitle: 'Product manager',
  company: 'Apple',
  skills: 'HTML, CSS and doing things in time',
  details:
    'I want to help you build awesome solutions to accomplish your goals and vision. I can create intuitive and aesthetically pleasing devices that are very easy to use.',
};
