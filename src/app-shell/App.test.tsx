import { render, screen, within } from '@testing-library/react'
import type { WorkoutSource } from '../workout/workout-source'
import { sourceOf, threeDays } from '../features/today-workout/test-support/fake-plan'
import { App } from './App'

const buildId = () => within(screen.getByRole('contentinfo')).getByTestId('build-id')

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('App', () => {
  it('shows the planned days from the source it is given', async () => {
    render(<App source={sourceOf(threeDays)} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Day 1 — type A' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('list', { name: 'Exercises' }))
  })

  it('names the build in the footer: its commit and when it was built, in UTC', async () => {
    render(<App source={sourceOf(threeDays)} />)
    await screen.findByRole('heading', { level: 1 })
    expect(buildId().textContent).toMatch(/^Build \S+ · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$/)
    expect(buildId()).toHaveTextContent(`Build ${__BUILD_COMMIT__} · `)
  })

  it('keeps the build in view when the plan fails to load, so a screenshot names it', async () => {
    const failing: WorkoutSource = { loadPlan: () => Promise.reject(new Error('no content')) }
    render(<App source={failing} />)
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the plan: no content")
    expect(buildId()).toHaveTextContent(`Build ${__BUILD_COMMIT__}`)
  })
})
