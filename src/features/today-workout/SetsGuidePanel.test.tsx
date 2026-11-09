import { render, screen, within } from '@testing-library/react'
import { WorkoutView } from './WorkoutView'
import { threeWorkouts } from './test-support/fake-plan'
import type { SetsGuide } from '../../workout/types'

const guide: SetsGuide = {
  title: 'How to do the sets',
  sections: [
    { heading: 'The sets', table: { columns: ['Set', 'Weight'], rows: [['1', '60%'], ['4', '100%']] } },
    { heading: 'Good to know', items: ['Round to the nearest weight.'] },
  ],
}

describe('the sets guide', () => {
  it('is closed when the workout opens, and shows every section when opened', () => {
    const { container } = render(<WorkoutView workout={threeWorkouts[0]!} guide={guide} />)
    const panel = container.querySelector('details')!
    expect(panel).not.toHaveAttribute('open')
    expect(within(panel).getByText('How to do the sets').tagName).toBe('SUMMARY')

    panel.open = true
    expect(within(panel).getByRole('table')).toBeInTheDocument()
    expect(within(panel).getByRole('columnheader', { name: 'Weight' })).toBeInTheDocument()
    expect(within(panel).getByRole('rowheader', { name: '4' })).toBeInTheDocument()
    expect(within(panel).getByRole('cell', { name: '100%' })).toBeInTheDocument()
    expect(within(panel).getByText('Round to the nearest weight.')).toBeInTheDocument()
  })

  it('sits between the workout name and the exercises', () => {
    const { container } = render(<WorkoutView workout={threeWorkouts[0]!} guide={guide} />)
    const order = [...container.children].map((el) => el.tagName)
    expect(order).toEqual(['H1', 'DETAILS', 'OL'])
  })

  it('shows no panel when there is no guide', () => {
    const { container } = render(<WorkoutView workout={threeWorkouts[0]!} />)
    expect(container.querySelector('details')).toBeNull()
    expect(screen.queryByText('How to do the sets')).toBeNull()
  })
})
