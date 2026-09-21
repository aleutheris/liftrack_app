/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build identifier shown in the footer (EPIC-260007): GitHub Pages keeps no access logs, so this is
// the only way to tell which build a phone is running. CI provides GITHUB_SHA; local builds say "local".
const buildCommit = (process.env.GITHUB_SHA ?? 'local').slice(0, 7)
const buildTime = new Date().toISOString()

export default defineConfig({
  // Relative asset URLs, so one build works as a project site (/<repo>/) or on a custom domain.
  // The hosting-target decision stays open in ADR-260002 / EPIC-260002.
  base: './',
  plugins: [react()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
      // EPIC-260007: full coverage, enforced in CI so it cannot slip unnoticed.
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
})
