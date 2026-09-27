import { expect, test as setup } from '@playwright/test';

// reuseExistingServer may pick up a dev server on the real API; stop before it burns the rate limit.
setup('the dev server generates with the mock provider', async ({ request }) => {
  const response = await request.post('/api/generate', {
    data: { jobTitle: 'Product Designer', company: 'Acme', skills: 'Prototyping', details: '' },
    headers: { 'x-mock-scenario': 'rate-limit' },
  });

  expect(response.headers()['x-generation-provider']).toBe('mock');
});
