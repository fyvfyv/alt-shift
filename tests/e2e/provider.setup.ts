import { expect, test as setup } from '@playwright/test';

// Locally reuseExistingServer can hand the suite a dev server started with a real token; that
// would burn the API's rate limit and fail every mock-timing assertion, so stop before any test runs.
setup('the dev server generates with the mock provider', async ({ request }) => {
  const response = await request.post('/api/generate', {
    data: { jobTitle: 'Product Designer', company: 'Acme', skills: 'Prototyping', details: '' },
    headers: { 'x-mock-scenario': 'rate-limit' },
  });

  expect(response.headers()['x-generation-provider']).toBe('mock');
});
