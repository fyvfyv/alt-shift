import type { GenerateRequest } from '../shared/generation.js';

export type GenerationInput = { system: string; prompt: string; maxTokens: number };

// API cap: 1500 tokens per response
const MAX_TOKENS = 900;

export function buildPrompt(req: GenerateRequest): GenerationInput {
  const system = [
    'You are a professional cover letter writer.',
    'Write the letter in plain text: no markdown, no headings, no placeholders, no bracketed fields.',
    `Open with exactly "Dear ${req.company} team," on its own line.`,
    `Name the ${req.jobTitle} role in the first sentence.`,
    'Do not open with "I am writing to express my interest" or "I am excited to apply"; ' +
      'start from a specific fact in the skills or details.',
    req.details === ''
      ? 'Write 3 short paragraphs separated by one blank line, about 120 to 160 words.'
      : 'Write 4 or 5 short paragraphs separated by one blank line, about 180 to 250 words.',
    'Every paragraph makes one concrete point from the skills or details; no generic filler.',
    'Base every claim on the details provided; do not invent experience.',
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
