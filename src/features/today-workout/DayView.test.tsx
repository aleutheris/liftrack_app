import { render, screen, within } from '@testing-library/react'
import { DayView } from './DayView'
import { threeDays } from './test-support/fake-plan'

const [day1] = threeDays

describe('DayView', () => {
  it("heads the page with the day's name", () => {
    render(<DayView day={day1} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Day 1 — type A' })).toBeInTheDocument()
  })

  it('lists the exercises in planned order, one article per list item', () => {
    render(<DayView day={day1} />)
    const items = within(screen.getByRole('list', { name: 'Exercises' })).getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('article'))).toHaveLength(2)
    expect(items.map((item) => within(item).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Leg press',
      'Seated leg curl',
    ])
  })

  it("loads the first exercise's pictures at once and ahead of the rest, which load lazily", () => {
    render(<DayView day={day1} />)
    const [first, second] = within(screen.getByRole('list', { name: 'Exercises' })).getAllByRole('listitem')
    for (const picture of within(first!).getAllByRole('img')) {
      expect(picture).toHaveAttribute('loading', 'eager')
      expect(picture).toHaveAttribute('fetchpriority', 'high')
    }
    for (const picture of within(second!).getAllByRole('img')) {
      expect(picture).toHaveAttribute('loading', 'lazy')
      expect(picture).not.toHaveAttribute('fetchpriority')
    }
  })
})
