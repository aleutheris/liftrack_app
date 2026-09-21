import { defineConfig } from '@playwright/test'

// The built site is served under a sub-path, as GitHub Pages serves a project site
// (<owner>.github.io/<repo>/). An asset URL that ignores the relative base then 404s here too,
// instead of first showing up as a blank page on deploy day (EPIC-260007).
const port = 4173
const basePath = '/liftrack/'
const siteUrl = `http://localhost:${port}${basePath}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: siteUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // REQ-QR-260001's reference phone: 360 × 640 CSS px, touch only.
      name: 'mobile-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 640 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    // Serves the existing dist/ — it never builds, so CI checks the very files it deploys.
    // Run `npm run build` first; preview refuses to start without dist/.
    command: `npx vite preview --base ${basePath} --port ${port} --strictPort`,
    url: siteUrl,
    reuseExistingServer: false,
  },
})
