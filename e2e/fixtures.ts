import { test as base, expect, type Page, type Response } from '@playwright/test'

// Pages keeps no access logs, so a missing picture or script would go unnoticed after deploy. Every
// page-driving spec therefore fails on any failed request, HTTP error, console error or uncaught
// exception seen while it ran.

const assetTypes = new Set(['image', 'script', 'stylesheet', 'font'])

/** `vite preview` answers an unknown path with index.html and a 200, which would hide a missing file. */
function isHtmlFallback(response: Response): boolean {
  const contentType = response.headers()['content-type'] ?? ''
  return assetTypes.has(response.request().resourceType()) && contentType.startsWith('text/html')
}

function watchForProblems(page: Page, problems: string[]): void {
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'unknown'
    // A navigation (goto, reload) cancels requests still in flight; that is not a site defect.
    if (reason !== 'net::ERR_ABORTED') problems.push(`request failed (${reason}): ${request.url()}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`)
    else if (isHtmlFallback(response)) problems.push(`missing file, answered with the page: ${response.url()}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`uncaught error: ${error.message}`))
}

export const test = base.extend<{ cleanRun: void }>({
  cleanRun: [
    async ({ page }, use) => {
      const problems: string[] = []
      watchForProblems(page, problems)
      await use()
      expect(problems, 'failed requests, HTTP errors or console errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
