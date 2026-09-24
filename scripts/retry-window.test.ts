import { describe, expect, it } from 'vitest'
import { requestTimeoutMs, retriesWithin, roomForAnother, withAttempt } from './retry-window.ts'

// What this rule decides is when the live-site check stops. Too eager and it gives up while Pages'
// CDN is still serving the previous build; too patient and the job's timeout cuts the run off with no
// report at all. Both failures look like a broken deploy, so every boundary is pinned here.

const startedAt = 1_000_000 // any instant on Date.now()'s clock

describe('retriesWithin', () => {
  it('reads the window and the wait in seconds, and expects an attempt to cost a request timeout', () => {
    expect(retriesWithin(startedAt, 720, 20)).toEqual({
      deadline: startedAt + 720_000,
      intervalMs: 20_000,
      longestAttemptMs: requestTimeoutMs,
    })
  })
})

describe('roomForAnother', () => {
  it('counts the wait and the next attempt as already spent', () => {
    const retries = retriesWithin(startedAt, 100, 20) // a 20 s wait, then an attempt of up to 10 s
    expect(roomForAnother(retries, startedAt + 70_000), 'the next attempt would end on the deadline').toBe(true)
    expect(roomForAnother(retries, startedAt + 70_001), 'it would end 1 ms late').toBe(false)
  })

  it('gives up sooner once an attempt has proved slower than a request timeout', () => {
    const fresh = retriesWithin(startedAt, 100, 20)
    const now = startedAt + 60_000
    expect(roomForAnother(fresh, now), 'another 10 s attempt still fits').toBe(true)
    expect(roomForAnother(withAttempt(fresh, 25_000), now), 'another 25 s attempt does not').toBe(false)
  })

  it('stops after the first attempt when the window is zero, the by-hand one-shot', () => {
    const retries = withAttempt(retriesWithin(startedAt, 0, 0), 1_200)
    expect(roomForAnother(retries, startedAt + 1_200)).toBe(false)
  })

  it('leaves room to start an attempt after the 600 s the CDN may serve the old build', () => {
    // deploy.yml's settings: a 720 s window, attempts 20 s apart.
    const ci = retriesWithin(startedAt, 720, 20)
    expect(roomForAnother(ci, startedAt + 600_000), 'a build published 600 s ago still gets an attempt').toBe(true)
    expect(roomForAnother(ci, startedAt + 690_000), 'the last attempt starts 20 s after this').toBe(true)
    expect(roomForAnother(ci, startedAt + 690_001), 'past this, no attempt would end inside the window').toBe(false)
  })
})

describe('withAttempt', () => {
  it('keeps the longest attempt, not the most recent one', () => {
    const slowThenFast = withAttempt(withAttempt(retriesWithin(startedAt, 100, 20), 40_000), 800)
    expect(slowThenFast.longestAttemptMs).toBe(40_000)
  })

  it('changes nothing else, and nothing in the window it was given', () => {
    const fresh = retriesWithin(startedAt, 100, 20)
    const measured = withAttempt(fresh, 40_000)
    expect(measured.deadline).toBe(fresh.deadline)
    expect(measured.intervalMs).toBe(fresh.intervalMs)
    expect(fresh.longestAttemptMs, 'the window it was made from is untouched').toBe(requestTimeoutMs)
  })
})
