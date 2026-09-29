import { act, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { Workouts } from './Workouts'
import { pendingSource, sourceOf, threeWorkouts } from './test-support/fake-plan'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('Workouts', () => {
  it('says the plan is loading until it arrives, then shows the first workout', async () => {
    const pending = pendingSource()
    render(<Workouts source={pending.source} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading the plan')

    await act(async () => pending.resolve(threeWorkouts))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Workout 1 — type A' })).toBeInTheDocument()
    expect(screen.getByText('Workout 1 of 3')).toBeInTheDocument()
  })

  it('reports a failed load with its reason', async () => {
    const pending = pendingSource()
    render(<Workouts source={pending.source} />)
    await act(async () => pending.reject(new Error('plan.json is missing')))
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the plan: plan.json is missing")
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps each problem of a failed load on its own line', async () => {
    const pending = pendingSource()
    render(<Workouts source={pending.source} />)
    const problems = '2 problems:\nplan.json: workouts[3].id\nexercises.json: [0].name'
    await act(async () => pending.reject(new Error(problems)))
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe(`Couldn't load the plan: ${problems}`)
    // The test runner applies no stylesheet; workout.css gives this class `white-space: pre-line`.
    expect(alert).toHaveClass('load-error')
  })

  it('reports a failure that is not an Error', async () => {
    const pending = pendingSource()
    render(<Workouts source={pending.source} />)
    await act(async () => pending.reject('offline'))
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the plan: offline")
  })

  it('says so when no workouts are planned', async () => {
    render(<Workouts source={sourceOf([])} />)
    expect(await screen.findByText('No workouts planned yet.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Workouts' })).not.toBeInTheDocument()
  })

  it('loads under StrictMode, whose effects run twice', async () => {
    const source = sourceOf(threeWorkouts)
    const loadPlan = vi.spyOn(source, 'loadPlan')
    render(
      <StrictMode>
        <Workouts source={source} />
      </StrictMode>,
    )
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Workout 1 — type A')
    expect(loadPlan).toHaveBeenCalledTimes(2)
  })

  it('drops a plan that arrives after its source was replaced', async () => {
    const replaced = pendingSource()
    const current = pendingSource()
    const { rerender } = render(<Workouts source={replaced.source} />)
    rerender(<Workouts source={current.source} />)

    await act(async () => current.resolve(threeWorkouts.slice(1, 2)))
    await act(async () => replaced.resolve(threeWorkouts))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workout 2 — type B')
    expect(screen.getByText('Workout 1 of 1')).toBeInTheDocument()
  })
})
