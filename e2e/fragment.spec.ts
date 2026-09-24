import { readExpectedDays, type ExpectedDay } from './content'
import { dayPage, scrollToPageEnd } from './day-page'
import { expect, test } from './fixtures'

const days = readExpectedDays()
const first = days[0]
if (!first) throw new Error('content/plan.json has no days')

/** The day after the first. The tests that move to it are skipped while the plan has only one day. */
function secondDay(): ExpectedDay {
  const second = days[1]
  if (!second) throw new Error('content/plan.json has only one day')
  return second
}

test.describe('the day kept in the URL fragment', () => {
  test.skip(days.length < 2, 'needs at least two planned days to move between')

  test('a reload stays on the day being viewed', async ({ page }) => {
    const second = secondDay()
    const view = dayPage(page)
    await page.goto('./')
    await view.next.tap()
    await expect(page).toHaveURL(new RegExp(`#${second.id}$`))
    await page.reload()
    await expect(view.heading).toHaveText(second.name)
    await expect(view.position).toHaveText(`Day 2 of ${days.length}`)
  })

  test('paging replaces the fragment instead of adding history entries', async ({ page }) => {
    const second = secondDay()
    const view = dayPage(page)
    await page.goto('./')
    await expect(view.heading).toHaveText(first.name)
    const historyLength = await page.evaluate(() => history.length)
    await view.next.tap()
    await expect(view.heading).toHaveText(second.name)
    await view.previous.tap()
    await expect(view.heading).toHaveText(first.name)
    expect(await page.evaluate(() => history.length)).toBe(historyLength)
  })

  test('a fragment edited by hand is followed', async ({ page }) => {
    const second = secondDay()
    const view = dayPage(page)
    await page.goto('./')
    await expect(view.heading).toHaveText(first.name)
    await page.evaluate((id) => {
      location.hash = id
    }, second.id)
    await expect(view.heading).toHaveText(second.name)
  })

  test('changing the day scrolls back to the top', async ({ page }) => {
    const second = secondDay()
    const view = dayPage(page)
    await page.goto('./')
    await expect(view.heading).toHaveText(first.name)
    await scrollToPageEnd(page)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await view.next.tap()
    await expect(view.heading).toHaveText(second.name)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
})

test('an unknown fragment shows the first day', async ({ page }) => {
  const view = dayPage(page)
  await page.goto('#no-such-day')
  await expect(view.heading).toHaveText(first.name)
  await expect(view.position).toHaveText(`Day 1 of ${days.length}`)
  await expect(view.previous).toBeDisabled()
})
