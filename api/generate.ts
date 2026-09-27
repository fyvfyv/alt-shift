if (process.env.VERCEL_ENV && !process.env.GENERATION_API_TOKEN) {
  throw new Error('GENERATION_API_TOKEN missing');
}

export { POST } from '../server/generate.js';
