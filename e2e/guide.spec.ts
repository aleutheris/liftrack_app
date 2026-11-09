import { readExpectedGuide, readExpectedWorkouts } from './content'
import { expect, test } from './fixtures'
import { sampleVisibleText } from './text-audit'
import { workoutPage } from './workout-page'

// ICR-260005: the sets guide is on every workout, closed until tapped, and read from content/guide.json
// at test time. With no guide.json the page shows no panel, and these checks have nothing to find.
const guide = readExpectedGuide()
const workouts = readExpectedWorkouts()

test.skip(!guide, 'content/ has no guide.json')

test('every workout has the guide, closed, between its name and its exercises', async ({ page }) => {
  const view = workoutPage(page)
  await page.goto('./')
  for (const [index, workout] of workouts.entries()) {
    if (index > 0) await view.next.tap()
    await expect(view.heading).toHaveText(workout.name)
    const panel = page.locator('details.guide')
    await expect(panel).toHaveCount(1)
    await expect(panel).not.toHaveJSProperty('open', true)
    await expect(panel.getByText(guide!.title, { exact: true })).toBeVisible()
    await expect(view.exerciseList).toBeVisible()
  }
})

test('opening the guide shows every heading, table cell and line of content/guide.json', async ({ page }) => {
  await page.goto('./')
  const panel = page.locator('details.guide')
  await panel.getByText(guide!.title, { exact: true }).tap()
  await expect(panel).toHaveJSProperty('open', true)
  for (const section of guide!.sections) {
    await expect(panel.getByRole('heading', { level: 2, name: section.heading, exact: true })).toBeVisible()
    for (const column of section.table?.columns ?? []) {
      await expect(panel.getByRole('columnheader', { name: column, exact: true }).first()).toBeVisible()
    }
    for (const cell of section.table?.rows.flat() ?? []) {
      await expect(panel.getByText(cell, { exact: true }).first()).toBeVisible()
    }
    for (const item of section.items ?? []) {
      await expect(panel.getByText(item, { exact: true })).toBeVisible()
    }
  }
})

test('opened, the guide fits the screen width and its text is legible', async ({ page }) => {
  const { width } = page.viewportSize() ?? { width: 0 }
  await page.goto('./')
  await page.locator('details.guide').getByText(guide!.title, { exact: true }).tap()
  const samples = await page.evaluate(sampleVisibleText)
  expect(samples.filter((s) => s.fontSize < 16).map((s) => `"${s.text}" at ${s.fontSize}px`)).toEqual([])
  expect(samples.filter((s) => !s.inactive && s.contrast < 4.5).map((s) => `"${s.text}" at ${s.contrast.toFixed(2)}:1`)).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  const summary = await page.locator('details.guide summary').boundingBox()
  expect(summary?.height ?? 0).toBeGreaterThanOrEqual(48)
})
