import { act, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { WorkoutDays } from './WorkoutDays'
import { pendingSource, sourceOf, threeDays } from './test-support/fake-plan'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('WorkoutDays', () => {
  it('says the plan is loading until it arrives, then shows the first day', async () => {
    const pending = pendingSource()
    render(<WorkoutDays source={pending.source} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading the plan')

    await act(async () => pending.resolve(threeDays))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Day 1 — type A' })).toBeInTheDocument()
    expect(screen.getByText('Day 1 of 3')).toBeInTheDocument()
  })

  it('reports a failed load with its reason', async () => {
    const pending = pendingSource()
    render(<WorkoutDays source={pending.source} />)
    await act(async () => pending.reject(new Error('plan.json is missing')))
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the plan: plan.json is missing")
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps each problem of a failed load on its own line', async () => {
    const pending = pendingSource()
    render(<WorkoutDays source={pending.source} />)
    const problems = '2 problems:\nplan.json: days[3].id\nexercises.json: [0].name'
    await act(async () => pending.reject(new Error(problems)))
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe(`Couldn't load the plan: ${problems}`)
    // The test runner applies no stylesheet; workout.css gives this class `white-space: pre-line`.
    expect(alert).toHaveClass('load-error')
  })

  it('reports a failure that is not an Error', async () => {
    const pending = pendingSource()
    render(<WorkoutDays source={pending.source} />)
    await act(async () => pending.reject('offline'))
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load the plan: offline")
  })

  it('says so when no days are planned', async () => {
    render(<WorkoutDays source={sourceOf([])} />)
    expect(await screen.findByText('No days planned yet.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Days' })).not.toBeInTheDocument()
  })

  it('loads under StrictMode, whose effects run twice', async () => {
    const source = sourceOf(threeDays)
    const loadPlan = vi.spyOn(source, 'loadPlan')
    render(
      <StrictMode>
        <WorkoutDays source={source} />
      </StrictMode>,
    )
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Day 1 — type A')
    expect(loadPlan).toHaveBeenCalledTimes(2)
  })

  it('drops a plan that arrives after its source was replaced', async () => {
    const replaced = pendingSource()
    const current = pendingSource()
    const { rerender } = render(<WorkoutDays source={replaced.source} />)
    rerender(<WorkoutDays source={current.source} />)

    await act(async () => current.resolve(threeDays.slice(1, 2)))
    await act(async () => replaced.resolve(threeDays))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Day 2 — type B')
    expect(screen.getByText('Day 1 of 1')).toBeInTheDocument()
  })
})
