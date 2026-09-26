import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompt';

const request = {
  jobTitle: 'Product Designer',
  company: 'Acme',
  skills: 'Figma, prototyping',
  details: 'Led a checkout redesign.\n\nMentored two juniors.',
};

describe('buildPrompt', () => {
  it('includes every field value in the prompt', () => {
    const { prompt } = buildPrompt(request);

    for (const value of Object.values(request)) {
      expect(prompt).toContain(value);
    }
  });

  it('omits the details section when details are empty', () => {
    expect(buildPrompt({ ...request, details: '' }).prompt).not.toMatch(/details/i);
  });
});
