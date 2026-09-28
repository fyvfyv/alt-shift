import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { patchCssModules } from 'vite-css-modules';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vitest/config';
import { generateApiPlugin } from './dev/devPlugin.ts';

// One list for the compiler and the bundler: tsconfig.app.json's `paths`. Not Vite's own
// tsconfigPaths, which skips files under .storybook.
function aliasesFromTsconfig() {
  const { compilerOptions } = JSON.parse(
    readFileSync(new URL('tsconfig.app.json', import.meta.url), 'utf8'),
  ) as {
    compilerOptions: { paths: Record<string, [string]> };
  };
  return Object.entries(compilerOptions.paths).map(([name, [target]]) => ({
    find: name.replace('/*', ''),
    replacement: fileURLToPath(new URL(target.replace('/*', ''), import.meta.url)),
  }));
}

export default defineConfig({
  plugins: [
    react(),
    // React Compiler memoizes components and hooks, so nothing needs useMemo/useCallback by hand.
    babel({ presets: [reactCompilerPreset()] }),
    svgr(),
    // Writes a .d.ts next to every CSS module, so a class name that doesn't exist fails the type check.
    patchCssModules({ generateSourceTypes: true }),
    generateApiPlugin(),
  ],
  resolve: { alias: aliasesFromTsconfig() },
  // The code may use any ES2025 API (tsconfig lib), which nothing polyfills: these are the first
  // versions that have all of them.
  build: { target: ['chrome136', 'edge136', 'firefox138', 'safari18.4', 'ios18.4'] },
  // One .env.local for the whole repo, at its root.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  test: {
    projects: [
      {
        // Plain node: the React and dev-server plugins stay out of the dev plugin's own tests.
        extends: false,
        test: {
          name: 'node',
          environment: 'node',
          unstubEnvs: true,
          unstubGlobals: true,
          include: ['dev/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          unstubEnvs: true,
          unstubGlobals: true,
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/services/**',
        'src/hooks/**',
        'src/pages/*/hooks/**',
        'src/pages/*/session/**',
      ],
      thresholds: {
        lines: 90,
        'src/services/generation/generationClient.ts': { branches: 95 },
        'src/services/generation/generationReducer.ts': { branches: 95 },
      },
    },
  },
});
