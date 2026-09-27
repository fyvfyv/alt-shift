import type { GenerateRequest } from '../shared/generation.js';

export type GenerationInput = { system: string; prompt: string; maxTokens: number };

// API cap: 1500 tokens per response
const MAX_TOKENS = 900;

export function buildPrompt(req: GenerateRequest): GenerationInput {
  const system = [
    'You are a professional cover letter writer.',
    'Write the letter in plain text: no markdown, no headings, no placeholders, no bracketed fields.',
    `Open with exactly "Dear ${req.company} team," on its own line.`,
    // Asked for an example the input lacks, the model invents one, hence the empty-details line.
    req.details === ''
      ? 'Begin the first paragraph with what the applicant does with their most specific skill. ' +
        'No projects, results or numbers were given, so state none.'
      : 'Begin the first paragraph with the strongest concrete example in the details, a result, ' +
        'a project or a problem the applicant solved, stated plainly in the first person. If the ' +
        'details hold no such example, begin with what the applicant does with their most ' +
        'specific skill and state no results.',
    `Name the ${req.jobTitle} role at ${req.company} later in that first paragraph.`,
    'Never open with years of experience, with "As a", or with a remark about applying or being ' +
      'excited.',
    req.details === ''
      ? 'Write 3 short paragraphs separated by one blank line, about 120 to 160 words.'
      : 'Write 4 or 5 short paragraphs separated by one blank line, about 180 to 250 words.',
    'Every paragraph makes one concrete point from the skills or details; no generic filler.',
    'Base every claim on the skills and details provided. Every number in the letter must appear ' +
      'in the details; never invent results, metrics or projects.',
    // Without this the model signs off with a "[Your Name]" placeholder.
    'End with "Sincerely," as the last line and nothing after it.',
  ].join('\n');

  const lines = [
    `Job title: ${req.jobTitle}`,
    `Company: ${req.company}`,
    `Key skills: ${req.skills}`,
  ];
  if (req.details) {
    lines.push('', 'Additional details:', req.details);
  }

  return { system, prompt: lines.join('\n'), maxTokens: MAX_TOKENS };
}
