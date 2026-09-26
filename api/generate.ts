// Fail the cold start rather than silently serve a deployment that cannot generate.
if (process.env.VERCEL_ENV && !process.env.GENERATION_API_TOKEN) {
  throw new Error('GENERATION_API_TOKEN missing');
}

export { POST } from '../server/generate.js';
