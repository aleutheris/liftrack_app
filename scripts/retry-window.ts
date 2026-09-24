// How long the live-site check (scripts/check-live-site.ts) keeps trying, in a module of its own so
// it can be unit-tested: that script fetches the site and starts retrying as soon as it is imported.

// Short enough that one stalled request cannot eat the window: an attempt fetches the page and the
// few files it references, so its worst case is this timeout times a handful.
export const requestTimeoutMs = 10_000

/** The room a run has left: when it must be over, how long it waits between attempts, and what it
 *  expects one attempt to cost. Times are milliseconds, deadline on `Date.now()`'s clock. */
export type Retries = {
  readonly deadline: number
  readonly intervalMs: number
  readonly longestAttemptMs: number
}

/** The room a run starts with. Nothing has been timed yet, so an attempt is assumed to cost what a
 *  single request that never answers costs — the check then never starts an attempt it cannot pay for. */
export function retriesWithin(startedAt: number, deadlineSeconds: number, intervalSeconds: number): Retries {
  return {
    deadline: startedAt + deadlineSeconds * 1000,
    intervalMs: intervalSeconds * 1000,
    longestAttemptMs: requestTimeoutMs,
  }
}

/** The same room once an attempt has taken this long. The estimate is the longest attempt so far, not
 *  the last one: a site that answered slowly once can do so again, and a fast answer proves nothing. */
export function withAttempt(retries: Retries, attemptMs: number): Retries {
  return { ...retries, longestAttemptMs: Math.max(retries.longestAttemptMs, attemptMs) }
}

/** Whether to try again: true while the wait plus one more attempt would still end inside the window.
 *  An attempt already running is never cut off, so a run can overshoot by at most one attempt. */
export function roomForAnother(retries: Retries, now: number): boolean {
  return now + retries.intervalMs + retries.longestAttemptMs <= retries.deadline
}
