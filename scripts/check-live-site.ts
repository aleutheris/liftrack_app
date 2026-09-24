// Checks the live site after a deploy (EPIC-260007, REQ-OR-260001): the page loads, every script,
// stylesheet and icon its HTML references loads, and the JavaScript holds this commit's build id,
// which the footer shows once that JavaScript runs. The pictures, loaded by the JavaScript, are
// checked by the end-to-end tests against the same dist/. Pages' CDN can keep answering with the
// previous page after a deploy, so a failed attempt is retried within the window deploy.yml sets.
// When that window runs out, this ends with a report of its own, not cut off by the job's timeout.
// By hand, one attempt and no retry (CHECK_DEADLINE_SECONDS=0 leaves no time for a second):
//   PAGE_URL=<site>/ GITHUB_SHA=<commit> CHECK_DEADLINE_SECONDS=0 CHECK_INTERVAL_SECONDS=0 \
//     node scripts/check-live-site.ts
import { setTimeout as sleep } from 'node:timers/promises'
import { assetsOf, servedWrong } from './page-assets.ts'
import { requestTimeoutMs, retriesWithin, roomForAnother, withAttempt } from './retry-window.ts'

const pageUrl = new URL(setting('PAGE_URL'))
const sha = setting('GITHUB_SHA')
if (!/^[0-9a-f]{7,}$/.test(sha)) throw new Error(`GITHUB_SHA is not a commit id: ${sha}`)
const buildId = sha.slice(0, 7) // exactly as vite.config.ts derives __BUILD_COMMIT__
const deadlineSeconds = count('CHECK_DEADLINE_SECONDS', 0)
const intervalSeconds = count('CHECK_INTERVAL_SECONDS', 0)
const startedAt = Date.now()

function setting(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

function count(name: string, least: number): number {
  const value = Number(setting(name))
  if (!Number.isInteger(value) || value < least) throw new Error(`${name} must be a whole number >= ${least}`)
  return value
}

async function problems(): Promise<string[]> {
  const page = await fetch(pageUrl, { signal: AbortSignal.timeout(requestTimeoutMs) })
  const html = await page.text()
  if (page.status !== 200) return [`${pageUrl} answered HTTP ${page.status}, expected 200`]
  const found: string[] = []
  const scripts: { url: URL; body: string }[] = []
  for (const asset of assetsOf(html, page.url)) {
    const response = await fetch(asset.url, { signal: AbortSignal.timeout(requestTimeoutMs) })
    const body = await response.text()
    const wrong = servedWrong(asset, response.status, response.headers.get('content-type') ?? 'no type')
    if (wrong) found.push(wrong)
    else if (asset.kind === 'script') scripts.push({ url: asset.url, body })
  }
  // The bundle holds the id as a quoted string literal; the minifier picks the quote character.
  if (!scripts.some(({ body }) => new RegExp(`(["'\`])${buildId}\\1`).test(body))) {
    const searched = scripts.map((script) => script.url).join(', ') || 'no script loaded'
    found.push(`expected build id "${buildId}" in the page's scripts, not found in: ${searched}`)
  }
  return found
}

function describe(error: unknown): string {
  return error instanceof Error && error.cause ? `${error.message} (${String(error.cause)})` : String(error)
}

function secondsSinceStart(): number {
  return Math.round((Date.now() - startedAt) / 1000)
}

// Retries while another attempt still fits the window (see retry-window.ts for that rule), then says
// what is still wrong and fails, rather than leaving the job's timeout to cut the run off silently.
async function main(): Promise<number> {
  let retries = retriesWithin(startedAt, deadlineSeconds, intervalSeconds)
  for (let attempt = 1; ; attempt += 1) {
    const attemptStartedAt = Date.now()
    const found = await problems().catch((error: unknown) => [`request failed: ${describe(error)}`])
    if (found.length === 0) {
      console.log(`${pageUrl} serves build ${buildId}, and every file its HTML references.`)
      return 0
    }
    retries = withAttempt(retries, Date.now() - attemptStartedAt)
    const report = found.map((line) => `  - ${line}`).join('\n')
    if (!roomForAnother(retries, Date.now())) {
      console.error(
        `Giving up: the live site is still wrong after ${attempt} attempt(s) in ${secondsSinceStart()} s,` +
          ` and another attempt would not finish inside the ${deadlineSeconds} s allowed:\n${report}`,
      )
      return 1
    }
    console.log(`Attempt ${attempt} failed ${secondsSinceStart()} s in; retrying in ${intervalSeconds} s:\n${report}`)
    await sleep(retries.intervalMs)
  }
}

process.exitCode = await main()
