import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MockInstance } from 'vitest'
import { DayPager } from './DayPager'
import { threeDays } from './test-support/fake-plan'

const shownDay = () => screen.getByRole('heading', { level: 1 }).textContent
const pager = () => within(screen.getByRole('navigation', { name: 'Days' }))
const previousDay = () => pager().getByRole('button', { name: 'Previous day' })
const nextDay = () => pager().getByRole('button', { name: 'Next day' })

function editFragment(fragment: string) {
  act(() => {
    window.history.replaceState(null, '', fragment)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

let scrollTo: MockInstance<typeof window.scrollTo>

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  // jsdom does not implement scrolling.
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DayPager', () => {
  it('opens on the first day, with nothing before it', () => {
    render(<DayPager days={threeDays} />)
    expect(shownDay()).toBe('Day 1 — type A')
    expect(pager().getByText('Day 1 of 3')).toHaveAttribute('aria-live', 'polite')
    expect(previousDay()).toBeDisabled()
    expect(nextDay()).toBeEnabled()
  })

  it('reaches every day in plan order, and back', async () => {
    const user = userEvent.setup()
    render(<DayPager days={threeDays} />)
    await user.click(nextDay())
    expect([shownDay(), pager().getByText(/^Day \d of 3$/).textContent]).toEqual(['Day 2 — type B', 'Day 2 of 3'])
    await user.click(nextDay())
    expect([shownDay(), pager().getByText(/^Day \d of 3$/).textContent]).toEqual(['Day 3 — type A', 'Day 3 of 3'])
    expect(nextDay()).toBeDisabled()
    expect(previousDay()).toBeEnabled()
    await user.click(previousDay())
    expect([shownDay(), pager().getByText(/^Day \d of 3$/).textContent]).toEqual(['Day 2 — type B', 'Day 2 of 3'])
    expect(previousDay()).toBeEnabled()
    await user.click(previousDay())
    expect([shownDay(), pager().getByText(/^Day \d of 3$/).textContent]).toEqual(['Day 1 — type A', 'Day 1 of 3'])
    expect(previousDay()).toBeDisabled()
  })

  it('keeps keyboard focus in the bar when a press reaches either end of the plan', async () => {
    const user = userEvent.setup()
    render(<DayPager days={threeDays} />)
    nextDay().focus()
    await user.keyboard('{Enter}')
    expect(nextDay()).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(shownDay()).toBe('Day 3 — type A')
    expect(previousDay()).toHaveFocus()
    await user.keyboard('{Enter}{Enter}')
    expect(shownDay()).toBe('Day 1 — type A')
    expect(nextDay()).toHaveFocus()
  })

  it('leaves the focus alone when the pressed button did not have it', () => {
    window.history.replaceState(null, '', '#day-2')
    render(<DayPager days={threeDays} />)
    // A tap in Safari presses a button without focusing it.
    fireEvent.click(nextDay())
    expect(shownDay()).toBe('Day 3 — type A')
    expect(document.body).toHaveFocus()
  })

  it('keeps the viewed day in the fragment, replacing the history entry rather than adding one', async () => {
    const user = userEvent.setup()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const entries = window.history.length
    render(<DayPager days={threeDays} />)
    await user.click(nextDay())
    expect(replaceState).toHaveBeenLastCalledWith(null, '', '#day-2')
    expect(window.location.hash).toBe('#day-2')
    expect(window.history.length).toBe(entries)
  })

  it('scrolls to the top when the day changes', async () => {
    const user = userEvent.setup()
    render(<DayPager days={threeDays} />)
    expect(scrollTo).not.toHaveBeenCalled()
    await user.click(nextDay())
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('opens on the day the fragment names', () => {
    window.history.replaceState(null, '', '#day-3')
    render(<DayPager days={threeDays} />)
    expect(shownDay()).toBe('Day 3 — type A')
    expect(pager().getByText('Day 3 of 3')).toBeInTheDocument()
    expect(nextDay()).toBeDisabled()
  })

  it('opens on the first day when the fragment names no planned day', () => {
    window.history.replaceState(null, '', '#day-9')
    render(<DayPager days={threeDays} />)
    expect(shownDay()).toBe('Day 1 — type A')
  })

  it('follows a hand-edited fragment, and scrolls to the top', () => {
    render(<DayPager days={threeDays} />)
    editFragment('#day-2')
    expect(shownDay()).toBe('Day 2 — type B')
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    editFragment('#no-such-day')
    expect(shownDay()).toBe('Day 1 — type A')
  })

  it('stays on the viewed day when the plan arrives again, and opens on the first day if it is gone', () => {
    window.history.replaceState(null, '', '#day-2')
    const { rerender } = render(<DayPager days={threeDays} />)
    const [first, ...rest] = structuredClone(threeDays)
    rerender(<DayPager days={[first, ...rest]} />)
    expect([shownDay(), pager().getByText(/^Day \d of \d$/).textContent]).toEqual(['Day 2 — type B', 'Day 2 of 3'])
    rerender(<DayPager days={[first, ...rest.filter((day) => day.id !== 'day-2')]} />)
    expect([shownDay(), pager().getByText(/^Day \d of \d$/).textContent]).toEqual(['Day 1 — type A', 'Day 1 of 2'])
  })

  it('stops following the fragment once it is gone', () => {
    const { unmount } = render(<DayPager days={threeDays} />)
    unmount()
    editFragment('#day-2')
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
