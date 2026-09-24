import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

// REQ-QR-260002's slow gym connection (1.6 Mbps) allows the initial JS and CSS 250 KB compressed.
// Measured on the built files, not the page, so the number does not depend on what the browser
// happens to cache. The per-picture budget is the content check's (npm test), before the build.

const kilobyte = 1024
const assetsDir = new URL('../dist/assets/', import.meta.url)

test('the built JS and CSS total at most 250 KB gzip-compressed', () => {
  const files = readdirSync(assetsDir).filter((name) => /\.(js|css)$/.test(name))
  expect(files, 'JS and CSS files in dist/assets').not.toHaveLength(0)
  const compressed = files.reduce((total, name) => total + gzipSync(readFileSync(new URL(name, assetsDir))).length, 0)
  expect(compressed, `gzip size of ${files.join(', ')} in bytes`).toBeLessThanOrEqual(250 * kilobyte)
})
