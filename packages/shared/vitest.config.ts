import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      thresholds: {
        lines: 90,
        'src/variantDecoder.ts': { branches: 95 },
        'src/generation.ts': { branches: 95 },
      },
    },
  },
});
