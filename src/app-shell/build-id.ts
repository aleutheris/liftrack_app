/** "Build 1a2b3c4 · 2026-09-21 10:47 UTC", from the short commit and the ISO-8601 build time. */
export function formatBuildId(commit: string, isoTime: string): string {
  const utc = new Date(isoTime).toISOString()
  return `Build ${commit} · ${utc.slice(0, 10)} ${utc.slice(11, 16)} UTC`
}
