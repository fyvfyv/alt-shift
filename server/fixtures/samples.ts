import type { GenerateRequest } from '../../shared/generation.js';

export type FixtureName = 'short' | 'medium' | 'long';

// The requests the transcripts were recorded with: the recorder sends them, the mock swaps their
// job title and company for the live request's. `details` lengths (~80 / ~400 / ~1000 chars)
// land in the mock's short / medium / long buckets.
export const SAMPLES: Record<FixtureName, GenerateRequest> = {
  short: {
    jobTitle: 'Frontend Engineer',
    company: 'Northwind',
    skills: 'React, TypeScript, accessibility',
    details: 'Four years building design systems; I care about fast, accessible interfaces.',
  },
  medium: {
    jobTitle: 'Product Designer',
    company: 'Lumen Health',
    skills: 'Figma, user research, prototyping, design systems',
    details:
      'For the past five years I have designed patient-facing products at a telehealth startup. ' +
      'I led the redesign of our appointment booking flow, which cut drop-off by a third, and ' +
      'set up a component library shared by three product teams. I run weekly usability ' +
      'sessions with patients and clinicians and turn the findings into prioritised backlogs. ' +
      'I am looking for a team where research shapes the roadmap.',
  },
  long: {
    jobTitle: 'Senior Backend Engineer',
    company: 'Harbor Logistics',
    skills: 'Go, PostgreSQL, Kafka, distributed systems, observability',
    details:
      'I have spent eight years building backend systems for marketplaces and logistics. At my ' +
      'current company I own the shipment tracking platform: a set of Go services that ingest ' +
      'carrier events through Kafka, reconcile them against PostgreSQL, and expose a real-time ' +
      'API used by forty thousand merchants. I led the migration from a monolith to event-driven ' +
      'services without downtime, introduced idempotent consumers after a painful incident with ' +
      'duplicated deliveries, and cut p99 latency of the tracking API from 900 to 120 ' +
      'milliseconds. I set up our tracing and SLO dashboards and run the on-call rotation for ' +
      'six engineers. Outside of delivery work I mentor two mid-level engineers, write most of ' +
      'our architecture decision records, and interview for the platform team. I enjoy hard ' +
      'correctness problems, clear written communication, and teams that treat operations as ' +
      'part of the product. I would like to bring that experience to routing and warehouse ' +
      'systems at a larger scale.',
  },
};
