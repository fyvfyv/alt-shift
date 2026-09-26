import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';
import { generateApiPlugin } from './server/devPlugin.ts';

export default defineConfig({
  plugins: [react(), svgr(), generateApiPlugin()],
  test: {
    clearMocks: true,
    projects: [
      {
        // Plain node: the React and dev-server plugins stay out of server-side tests.
        extends: false,
        test: {
          name: 'node',
          environment: 'node',
          unstubEnvs: true,
          unstubGlobals: true,
          include: ['server/**/*.test.ts', 'shared/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['server/**', 'shared/**', 'src/features/**'],
      exclude: ['server/devPlugin.ts', 'server/fixtures/**', '**/*.test.*'],
      thresholds: {
        lines: 90,
        'src/features/generation/generationClient.ts': { branches: 95 },
        'src/features/generation/generationReducer.ts': { branches: 95 },
        'src/features/generation/variantDecoder.ts': { branches: 95 },
        'shared/generation.ts': { branches: 95 },
      },
    },
  },
});
