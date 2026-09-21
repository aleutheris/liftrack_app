import { formatBuildId } from './build-id'

// CI runs in UTC, where local time and UTC agree; a zone off by hours and minutes tells them apart.
beforeAll(() => {
  vi.stubEnv('TZ', 'Asia/Kolkata')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

describe('formatBuildId', () => {
  it('is checked in a time zone away from UTC', () => {
    expect(new Date('2026-09-21T10:47:00Z').getTimezoneOffset()).toBe(-330)
  })

  it('reads "Build <commit> · YYYY-MM-DD HH:MM UTC"', () => {
    expect(formatBuildId('1a2b3c4', '2026-09-21T10:47:13.512Z')).toBe('Build 1a2b3c4 · 2026-09-21 10:47 UTC')
  })

  it('keeps leading zeros', () => {
    expect(formatBuildId('local', '2026-01-02T03:04:05.000Z')).toBe('Build local · 2026-01-02 03:04 UTC')
  })

  it('states a time given with an offset in UTC', () => {
    expect(formatBuildId('1a2b3c4', '2026-09-21T01:30:00+02:00')).toBe('Build 1a2b3c4 · 2026-09-20 23:30 UTC')
  })
})
