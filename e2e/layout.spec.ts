import type { Locator, Page } from '@playwright/test'
import { readExpectedDays } from './content'
import { dayPage, scrollToPageEnd, type DayPage } from './day-page'
import { expect, test } from './fixtures'
import { sampleVisibleText, type TextSample } from './text-audit'

// REQ-QR-260001 measured on the built page at 360 × 640 (the project's viewport), at the default
// text size and with the browser's text size raised.

const days = readExpectedDays()
// CI builds and tests with GITHUB_SHA set, so there the footer must name the commit being deployed.
const buildCommit = process.env.GITHUB_SHA?.slice(0, 7) ?? 'local'
const minimumTouchTarget = 48
const minimumTouchGap = 8
const uprightPicture =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"></svg>')

type Box = { x: number; y: number; width: number; height: number }

function tooSmall(samples: TextSample[]): string[] {
  return samples.filter((s) => s.fontSize < (s.isCount ? 24 : 16)).map((s) => `"${s.text}" at ${s.fontSize}px`)
}

function tooFaint(samples: TextSample[]): string[] {
  return samples
    .filter((s) => !s.inactive && s.contrast < (s.isCount ? 7 : 4.5))
    .map((s) => `"${s.text}" at ${s.contrast.toFixed(2)}:1`)
}

function gapBetween(a: Box, b: Box): number {
  const horizontal = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width))
  const vertical = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height))
  return Math.max(horizontal, vertical)
}

/** How far `inner` reaches past the left or right edge of `outer`, in CSS px; 0 when it lies within. */
function reachSideways(inner: Box, outer: Box): number {
  return Math.max(0, outer.x - inner.x, inner.x + inner.width - (outer.x + outer.width))
}

/** How far `inner` reaches past any edge of `outer`, in CSS px; 0 when it lies within. */
function reachOutside(inner: Box, outer: Box): number {
  const bottom = inner.y + inner.height - (outer.y + outer.height)
  return Math.max(reachSideways(inner, outer), outer.y - inner.y, bottom)
}

/** The fixed (or sticky) bar holding the paging buttons: the nav itself or its nearest such ancestor. */
function pagingBar(pager: Locator): Promise<Box | null> {
  return pager.evaluate((nav) => {
    for (let e: Element | null = nav; e; e = e.parentElement) {
      if (['fixed', 'sticky'].includes(getComputedStyle(e).position)) {
        const { x, y, width, height } = e.getBoundingClientRect()
        return { x, y, width, height }
      }
    }
    return null
  })
}

/**
 * An element's box, and the box of its text as laid out. Text too wide for the element runs past its
 * sides; its height is no measure, as glyphs may rise above a tight line-height without being cut.
 */
function boxAndText(element: Locator): Promise<{ box: Box; text: Box }> {
  return element.evaluate((e) => {
    const text = document.createRange()
    text.selectNodeContents(e)
    const plain = ({ x, y, width, height }: DOMRect) => ({ x, y, width, height })
    return { box: plain(e.getBoundingClientRect()), text: plain(text.getBoundingClientRect()) }
  })
}

/** Scrolls to the end of the page and checks the last exercise ends above the paging bar. */
async function expectLastExerciseClear(page: Page, view: DayPage): Promise<Box> {
  await scrollToPageEnd(page)
  const [lastExercise, bar] = await Promise.all([view.exercises.last().boundingBox(), pagingBar(view.pager)])
  if (!lastExercise || !bar) throw new Error('the last exercise or the paging bar is not rendered')
  expect(lastExercise.y + lastExercise.height, 'last exercise bottom edge').toBeLessThanOrEqual(bar.y + 0.5)
  return bar
}

test('every day is legible at arm’s length and fits the screen width', async ({ page }) => {
  const view = dayPage(page)
  const { width } = page.viewportSize() ?? { width: 0 }
  await page.goto('./')
  for (const [index, day] of days.entries()) {
    if (index > 0) await view.next.tap()
    await expect(view.heading).toHaveText(day.name)
    const samples = await page.evaluate(sampleVisibleText)
    expect(samples.filter((s) => s.isCount), 'set and rep counts found').not.toHaveLength(0)
    expect(tooSmall(samples), `text under its minimum size on "${day.name}"`).toEqual([])
    expect(tooFaint(samples), `text under its minimum contrast on "${day.name}"`).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth), 'page width').toBeLessThanOrEqual(width)
  }
})

test('the paging buttons are thumb-sized, apart, and in the lower half of the screen', async ({ page }) => {
  const view = dayPage(page)
  const { height } = page.viewportSize() ?? { height: 0 }
  await page.goto('./')
  const [previous, next] = await Promise.all([view.previous.boundingBox(), view.next.boundingBox()])
  if (!previous || !next) throw new Error('a paging button is not rendered')
  for (const box of [previous, next]) {
    expect(box.width, 'button width').toBeGreaterThanOrEqual(minimumTouchTarget)
    expect(box.height, 'button height').toBeGreaterThanOrEqual(minimumTouchTarget)
    expect(box.y, 'button top edge').toBeGreaterThanOrEqual(height / 2)
    expect(box.y + box.height, 'button bottom edge').toBeLessThanOrEqual(height)
  }
  expect(gapBetween(previous, next), 'space between the buttons').toBeGreaterThanOrEqual(minimumTouchGap)
})

test('the paging bar stays at the bottom without covering the last exercise', async ({ page }) => {
  const view = dayPage(page)
  const { height } = page.viewportSize() ?? { height: 0 }
  await page.goto('./')
  await expect(view.exercises.first()).toBeVisible()
  const barAtTop = await pagingBar(view.pager)
  if (!barAtTop) throw new Error('no fixed bar around the paging buttons')
  expect(Math.round(barAtTop.y + barAtTop.height), 'bar bottom edge at the top of the page').toBe(height)

  const barAtEnd = await expectLastExerciseClear(page, view)
  expect(Math.round(barAtEnd.y + barAtEnd.height), 'bar bottom edge at the end of the page').toBe(height)
})

// Text enlarged to 200% must lose nothing (WCAG 1.4.4). This sets Chromium's default font size, which
// is what the browser's text-size setting changes: unlike a font size set by the page itself, it also
// moves em-based media queries, as it does on the phone.
for (const scale of [1.5, 2]) {
  test(`with text at ${scale * 100}%, the paging labels show in full, clear of the last exercise`, async ({ page }) => {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: 16 * scale } })
    const view = dayPage(page)
    await page.goto('./')
    await expect(view.exercises.first()).toBeVisible()
    const bar = await pagingBar(view.pager)
    if (!bar) throw new Error('no fixed bar around the paging buttons')
    const items = { '"Previous day"': view.previous, 'the position': view.position, '"Next day"': view.next }
    for (const [name, item] of Object.entries(items)) {
      const { box, text } = await boxAndText(item)
      expect(reachSideways(text, box), `${name}: text wider than its own box, in px`).toBeLessThanOrEqual(0.5)
      expect(reachOutside(box, bar), `${name}: outside the bar or off the screen, in px`).toBeLessThanOrEqual(0.5)
    }
    await expectLastExerciseClear(page, view)
  })
}

// A phone photo is as often upright as sideways, and the frame shows all of it either way: cropping
// to fill would cut a standing lifter's head or feet off. Swapping one in must not move the page.
test('shows a picture of any shape whole, in a frame that keeps its size', async ({ page }) => {
  const view = dayPage(page)
  await page.goto('./')
  // The first slot of the day, whether it holds a photo or the marker for one still to come: both
  // sit in the frame the page's own stylesheet gives them, which is what this measures.
  const slot = view.exercises.first().getByRole('article').locator('img, [data-testid="missing-picture"]').first()
  const frame = await slot.boundingBox()
  if (!frame) throw new Error('the first picture slot is not rendered')
  expect(Math.abs(frame.width - frame.height), 'the frame is square, in px').toBeLessThanOrEqual(0.5)
  const upright = await slot.evaluate(async (element: HTMLElement, source) => {
    // A photo put into that same frame: the page has none of its own until the owner adds them.
    const img = element.tagName === 'IMG' ? (element as HTMLImageElement) : new Image()
    if (img !== element) element.replaceWith(img)
    img.src = source
    await img.decode()
    const { width, height } = img.getBoundingClientRect()
    return { fit: getComputedStyle(img).objectFit, tall: img.naturalHeight > img.naturalWidth, width, height }
  }, uprightPicture)
  expect(upright.tall, 'the picture swapped in is upright').toBe(true)
  expect(upright.fit, 'the whole picture is shown, not cropped to fill').toBe('contain')
  expect(Math.abs(upright.width - frame.width), 'frame width, unchanged by an upright picture').toBeLessThanOrEqual(0.5)
  expect(Math.abs(upright.height - frame.height), 'frame height, unchanged').toBeLessThanOrEqual(0.5)
})

test('the footer shows which build is live, uncovered', async ({ page }) => {
  const view = dayPage(page)
  await page.goto('./')
  await expect(view.buildId).toHaveText(new RegExp(`^Build ${buildCommit} · \\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2} UTC$`))
  await scrollToPageEnd(page)
  const uncovered = await view.buildId.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect()
    const hit = document.elementFromPoint(left + width / 2, top + height / 2)
    return hit !== null && element.contains(hit)
  })
  expect(uncovered, 'the build id is on screen and not under the paging bar').toBe(true)
})
