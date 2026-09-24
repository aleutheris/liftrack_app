import type { Locator, Page } from '@playwright/test'
import { readExpectedDays, type ExpectedDay, type ExpectedExercise } from './content'
import { dayPage, type DayPage } from './day-page'
import { expect, test } from './fixtures'

const days = readExpectedDays()

async function expectPictureLoaded(picture: Locator): Promise<void> {
  // Lazy pictures load only near the viewport, as they would on the phone.
  await picture.scrollIntoViewIfNeeded()
  await expect
    .poll(() => picture.evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0)))
    .toBeGreaterThan(0)
}

async function expectExercise(item: Locator, exercise: ExpectedExercise, isFirst: boolean): Promise<void> {
  const article = item.getByRole('article')
  await expect(article.getByRole('heading', { level: 2 })).toHaveText(exercise.name)
  const cue = article.getByTestId('cue')
  await (exercise.cue ? expect(cue).toHaveText(exercise.cue) : expect(cue).toHaveCount(0))
  await expect(article.getByTestId('prescription')).toHaveText(exercise.prescription)
  await expect(article.getByTestId('sets')).toHaveText(exercise.sets)
  await expect(article.getByTestId('reps')).toHaveText(exercise.reps)
  // Two slots, always: the photos taken so far, and a plain marker for each one still to come, so a
  // day is shown in full whether or not its photos exist yet.
  await expect(article.getByRole('img')).toHaveCount(exercise.photos)
  await expect(article.getByTestId('missing-picture')).toHaveCount(2 - exercise.photos)
  for (const number of [1, 2]) {
    if (number > exercise.photos) {
      await expect(article.getByText(`Photo ${number} missing`, { exact: true })).toBeVisible()
      continue
    }
    const picture = article.getByRole('img', { name: `${exercise.name} — picture ${number} of 2`, exact: true })
    await expect(picture).toHaveJSProperty('loading', isFirst ? 'eager' : 'lazy')
    // A file of its own, not inlined into the script, or lazy loading would save nothing.
    await expect(picture).not.toHaveAttribute('src', /^data:/)
    await expectPictureLoaded(picture)
  }
}

async function expectDay(page: Page, view: DayPage, day: ExpectedDay, index: number): Promise<void> {
  await expect(view.heading).toHaveText(day.name)
  await expect(view.position).toHaveText(`Day ${index + 1} of ${days.length}`)
  await expect(view.exercises).toHaveCount(day.exercises.length)
  await expect(view.exerciseList.getByRole('heading', { level: 2 })).toHaveText(day.exercises.map((e) => e.name))
  for (const [position, exercise] of day.exercises.entries()) {
    await expectExercise(view.exercises.nth(position), exercise, position === 0)
  }
  // ADR-260001's vocabulary: the owner's "sequences" are sets on the page.
  await expect(page.locator('body')).not.toContainText(/sequence/i)
}

// One test per day, so each takes the same time however long the plan grows, and they run in parallel.
for (const [index, day] of days.entries()) {
  test(`#${day.id} shows its day in full`, async ({ page }) => {
    const view = dayPage(page)
    await page.goto(`#${day.id}`)
    await expectDay(page, view, day, index)
  })
}

test('every planned day is reachable by tapping "Next day", in plan order', async ({ page }) => {
  const view = dayPage(page)
  await page.goto('./')
  for (const [index, day] of days.entries()) {
    if (index > 0) await view.next.tap()
    await expect(view.heading).toHaveText(day.name)
    await expect(view.position).toHaveText(`Day ${index + 1} of ${days.length}`)
    await expect(view.previous).toBeEnabled({ enabled: index > 0 })
    await expect(view.next).toBeEnabled({ enabled: index < days.length - 1 })
  }
})

test('"Previous day" pages back to the first day, in reverse order', async ({ page }) => {
  const view = dayPage(page)
  const last = days.at(-1)
  if (!last) throw new Error('content/plan.json has no days')
  await page.goto(`#${last.id}`)
  await expect(view.heading).toHaveText(last.name)
  for (const [index, day] of [...days.entries()].slice(0, -1).reverse()) {
    await view.previous.tap()
    await expect(view.heading).toHaveText(day.name)
    await expect(view.position).toHaveText(`Day ${index + 1} of ${days.length}`)
  }
  await expect(view.previous).toBeDisabled()
})
