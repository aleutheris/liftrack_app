import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MockInstance } from 'vitest'
import { WorkoutPager } from './WorkoutPager'
import { threeWorkouts } from './test-support/fake-plan'

const shownWorkout = () => screen.getByRole('heading', { level: 1 }).textContent
const pager = () => within(screen.getByRole('navigation', { name: 'Workouts' }))
const previousWorkout = () => pager().getByRole('button', { name: 'Previous workout' })
const nextWorkout = () => pager().getByRole('button', { name: 'Next workout' })
const shownPosition = () => pager().getByText(/^Workout \d of \d$/).textContent

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

describe('WorkoutPager', () => {
  it('opens on the first workout, with nothing before it', () => {
    render(<WorkoutPager workouts={threeWorkouts} />)
    expect(shownWorkout()).toBe('Workout 1 — type A')
    expect(pager().getByText('Workout 1 of 3')).toHaveAttribute('aria-live', 'polite')
    expect(previousWorkout()).toBeDisabled()
    expect(nextWorkout()).toBeEnabled()
  })

  it('reaches every workout in plan order, and back', async () => {
    const user = userEvent.setup()
    render(<WorkoutPager workouts={threeWorkouts} />)
    await user.click(nextWorkout())
    expect([shownWorkout(), shownPosition()]).toEqual(['Workout 2 — type B', 'Workout 2 of 3'])
    await user.click(nextWorkout())
    expect([shownWorkout(), shownPosition()]).toEqual(['Workout 3 — type A', 'Workout 3 of 3'])
    expect(nextWorkout()).toBeDisabled()
    expect(previousWorkout()).toBeEnabled()
    await user.click(previousWorkout())
    expect([shownWorkout(), shownPosition()]).toEqual(['Workout 2 — type B', 'Workout 2 of 3'])
    expect(previousWorkout()).toBeEnabled()
    await user.click(previousWorkout())
    expect([shownWorkout(), shownPosition()]).toEqual(['Workout 1 — type A', 'Workout 1 of 3'])
    expect(previousWorkout()).toBeDisabled()
  })

  it('keeps keyboard focus in the bar when a press reaches either end of the plan', async () => {
    const user = userEvent.setup()
    render(<WorkoutPager workouts={threeWorkouts} />)
    nextWorkout().focus()
    await user.keyboard('{Enter}')
    expect(nextWorkout()).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(shownWorkout()).toBe('Workout 3 — type A')
    expect(previousWorkout()).toHaveFocus()
    await user.keyboard('{Enter}{Enter}')
    expect(shownWorkout()).toBe('Workout 1 — type A')
    expect(nextWorkout()).toHaveFocus()
  })

  it('leaves the focus alone when the pressed button did not have it', () => {
    window.history.replaceState(null, '', '#workout-2')
    render(<WorkoutPager workouts={threeWorkouts} />)
    // A tap in Safari presses a button without focusing it.
    fireEvent.click(nextWorkout())
    expect(shownWorkout()).toBe('Workout 3 — type A')
    expect(document.body).toHaveFocus()
  })

  it('keeps the viewed workout in the fragment, replacing the history entry rather than adding one', async () => {
    const user = userEvent.setup()
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const entries = window.history.length
    render(<WorkoutPager workouts={threeWorkouts} />)
    await user.click(nextWorkout())
    expect(replaceState).toHaveBeenLastCalledWith(null, '', '#workout-2')
    expect(window.location.hash).toBe('#workout-2')
    expect(window.history.length).toBe(entries)
  })

  it('scrolls to the top when the workout changes', async () => {
    const user = userEvent.setup()
    render(<WorkoutPager workouts={threeWorkouts} />)
    expect(scrollTo).not.toHaveBeenCalled()
    await user.click(nextWorkout())
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('opens on the workout the fragment names', () => {
    window.history.replaceState(null, '', '#workout-3')
    render(<WorkoutPager workouts={threeWorkouts} />)
    expect(shownWorkout()).toBe('Workout 3 — type A')
    expect(pager().getByText('Workout 3 of 3')).toBeInTheDocument()
    expect(nextWorkout()).toBeDisabled()
  })

  it('opens on the first workout when the fragment names no planned workout', () => {
    window.history.replaceState(null, '', '#workout-9')
    render(<WorkoutPager workouts={threeWorkouts} />)
    expect(shownWorkout()).toBe('Workout 1 — type A')
  })

  it('follows a hand-edited fragment, and scrolls to the top', () => {
    render(<WorkoutPager workouts={threeWorkouts} />)
    editFragment('#workout-2')
    expect(shownWorkout()).toBe('Workout 2 — type B')
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    editFragment('#no-such-workout')
    expect(shownWorkout()).toBe('Workout 1 — type A')
  })

  it('stays on the viewed workout when the plan arrives again, and opens on the first workout if it is gone', () => {
    window.history.replaceState(null, '', '#workout-2')
    const { rerender } = render(<WorkoutPager workouts={threeWorkouts} />)
    const [first, ...rest] = structuredClone(threeWorkouts)
    rerender(<WorkoutPager workouts={[first, ...rest]} />)
    expect([shownWorkout(), shownPosition()]).toEqual(['Workout 2 — type B', 'Workout 2 of 3'])
    rerender(<WorkoutPager workouts={[first, ...rest.filter((workout) => workout.id !== 'workout-2')]} />)
    expect([shownWorkout(), shownPosition()]).toEqual(['Workout 1 — type A', 'Workout 1 of 2'])
  })

  it('stops following the fragment once it is gone', () => {
    const { unmount } = render(<WorkoutPager workouts={threeWorkouts} />)
    unmount()
    editFragment('#workout-2')
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
