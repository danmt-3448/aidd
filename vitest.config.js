import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Vite dev server port (used by `vitest --ui` / browser mode). Pinned to 3001
  // to match the app dev server. Unit tests (happy-dom) do not use a port.
  server: {
    port: 3001,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', '.claude'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types.ts',
      ],
      // Floor = measured baseline (not aspirational). Fails CI/local if coverage
      // regresses below current levels. Raise deliberately as coverage grows.
      // Baseline measured 2026-08-20: lines 37.82 · statements 37.03 · funcs 33.5 · branches 32.65.
      // Floor set just below baseline so any regression fails; raise as coverage grows.
      // statements floored at 36 (not 37) to give ~1pt breathing room vs the tight 37.03 baseline.
      thresholds: {
        lines: 37,
        functions: 33,
        branches: 32,
        statements: 36,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
