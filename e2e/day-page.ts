import type { Page } from '@playwright/test'

/** The page's landmarks, located the way a screen reader finds them (the DOM contract). */
export function dayPage(page: Page) {
  const pager = page.getByRole('navigation', { name: 'Days' })
  const exerciseList = page.getByRole('list', { name: 'Exercises' })
  return {
    heading: page.getByRole('heading', { level: 1 }),
    exerciseList,
    exercises: exerciseList.locator(':scope > li'),
    pager,
    previous: pager.getByRole('button', { name: 'Previous day', exact: true }),
    next: pager.getByRole('button', { name: 'Next day', exact: true }),
    position: pager.locator('[aria-live="polite"]'),
    buildId: page.getByRole('contentinfo').getByTestId('build-id'),
  }
}

export type DayPage = ReturnType<typeof dayPage>

export async function scrollToPageEnd(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
}
