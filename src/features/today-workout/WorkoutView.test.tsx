import { render, screen, within } from '@testing-library/react'
import { WorkoutView } from './WorkoutView'
import { threeWorkouts } from './test-support/fake-plan'

const [workout1] = threeWorkouts

describe('WorkoutView', () => {
  it("heads the page with the workout's name", () => {
    render(<WorkoutView workout={workout1} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Workout 1 — type A' })).toBeInTheDocument()
  })

  it('lists the exercises in planned order, one article per list item', () => {
    render(<WorkoutView workout={workout1} />)
    const items = within(screen.getByRole('list', { name: 'Exercises' })).getAllByRole('listitem')
    expect(items.map((item) => within(item).getByRole('article'))).toHaveLength(2)
    expect(items.map((item) => within(item).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Leg press',
      'Seated leg curl',
    ])
  })

  it("loads the first exercise's pictures at once and ahead of the rest, which load lazily", () => {
    render(<WorkoutView workout={workout1} />)
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
