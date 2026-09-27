import type { GenerateRequest } from './generation.js';

// The mockups' example. Try an example hands it to the form, and the mock's short transcript is
// recorded from it, so the letter it produces offline is written for this input, not another's.
export const EXAMPLE_REQUEST: GenerateRequest = {
  jobTitle: 'Product manager',
  company: 'Apple',
  skills: 'HTML, CSS and doing things in time',
  details:
    'I want to help you build awesome solutions to accomplish your goals and vision. I can create intuitive and aesthetically pleasing devices that are very easy to use.',
};
