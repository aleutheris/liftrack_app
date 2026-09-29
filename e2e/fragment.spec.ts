import { readExpectedWorkouts, type ExpectedWorkout } from './content'
import { workoutPage, scrollToPageEnd } from './workout-page'
import { expect, test } from './fixtures'

const workouts = readExpectedWorkouts()
const first = workouts[0]
if (!first) throw new Error('content/plan.json has no workouts')

/** The workout after the first. The tests that move to it are skipped while the plan has only one workout. */
function secondWorkout(): ExpectedWorkout {
  const second = workouts[1]
  if (!second) throw new Error('content/plan.json has only one workout')
  return second
}

test.describe('the workout kept in the URL fragment', () => {
  test.skip(workouts.length < 2, 'needs at least two planned workouts to move between')

  test('a reload stays on the workout being viewed', async ({ page }) => {
    const second = secondWorkout()
    const view = workoutPage(page)
    await page.goto('./')
    await view.next.tap()
    await expect(page).toHaveURL(new RegExp(`#${second.id}$`))
    await page.reload()
    await expect(view.heading).toHaveText(second.name)
    await expect(view.position).toHaveText(`Workout 2 of ${workouts.length}`)
  })

  test('paging replaces the fragment instead of adding history entries', async ({ page }) => {
    const second = secondWorkout()
    const view = workoutPage(page)
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
    const second = secondWorkout()
    const view = workoutPage(page)
    await page.goto('./')
    await expect(view.heading).toHaveText(first.name)
    await page.evaluate((id) => {
      location.hash = id
    }, second.id)
    await expect(view.heading).toHaveText(second.name)
  })

  test('changing the workout scrolls back to the top', async ({ page }) => {
    const second = secondWorkout()
    const view = workoutPage(page)
    await page.goto('./')
    await expect(view.heading).toHaveText(first.name)
    await scrollToPageEnd(page)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await view.next.tap()
    await expect(view.heading).toHaveText(second.name)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
})

test('an unknown fragment shows the first workout', async ({ page }) => {
  const view = workoutPage(page)
  await page.goto('#no-such-workout')
  await expect(view.heading).toHaveText(first.name)
  await expect(view.position).toHaveText(`Workout 1 of ${workouts.length}`)
  await expect(view.previous).toBeDisabled()
})
