import { expect, test as setup } from '@playwright/test';

// Every flow asserts mock timings and fault scenarios. A server that picked up a real token
// would burn the API's rate limit and fail in confusing ways, so stop before any test runs.
setup('the dev server generates with the mock provider', async ({ request }) => {
  const response = await request.post('/api/generate', {
    data: { jobTitle: 'Product Designer', company: 'Acme', skills: 'Prototyping', details: '' },
    headers: { 'x-mock-scenario': 'rate-limit' },
  });

  expect(response.headers()['x-generation-provider']).toBe('mock');
});
