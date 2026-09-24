import { render, screen, within } from '@testing-library/react'
import { ExerciseCard } from './ExerciseCard'
import { exercise, prescription } from './test-support/fake-plan'

const legPress = exercise('leg-press', 'Leg press', 'Feet mid-platform, knees track over toes')

describe('ExerciseCard', () => {
  it('names the exercise in a second-level heading', () => {
    render(<ExerciseCard prescription={prescription(legPress, 4, 10)} eager />)
    expect(screen.getByRole('heading', { level: 2, name: 'Leg press' })).toBeInTheDocument()
  })

  it('shows the cue when the exercise has one', () => {
    render(<ExerciseCard prescription={prescription(legPress, 4, 10)} eager />)
    expect(screen.getByTestId('cue')).toHaveTextContent('Feet mid-platform, knees track over toes')
  })

  it('leaves the cue out when the exercise has none', () => {
    render(<ExerciseCard prescription={prescription(exercise('knee-raise', 'Knee raise'), 3, 12)} eager />)
    expect(screen.queryByTestId('cue')).not.toBeInTheDocument()
  })

  // The owner adds photos one at a time, and a day must never wait for them.
  it.each<[photos: 0 | 1 | 2, missing: string[]]>([
    [2, []],
    [1, ['Photo 2 missing']],
    [0, ['Photo 1 missing', 'Photo 2 missing']],
  ])('with %i of its photos taken, says which are missing', (photos, missing) => {
    render(<ExerciseCard prescription={prescription(exercise('row', 'Cable row', undefined, photos), 3, 10)} eager />)

    expect(screen.queryAllByTestId('missing-picture').map((slot) => slot.textContent)).toEqual(missing)
    expect(screen.queryAllByRole('img')).toHaveLength(2 - missing.length)
  })

  it('shows both pictures, in order, with their alt text and reserved dimensions', () => {
    render(<ExerciseCard prescription={prescription(legPress, 4, 10)} eager />)
    const pictures = screen.getAllByRole('img')
    expect(pictures.map((picture) => picture.getAttribute('alt'))).toEqual([
      'Leg press — picture 1 of 2',
      'Leg press — picture 2 of 2',
    ])
    expect(pictures.map((picture) => picture.getAttribute('src'))).toEqual([
      '/pictures/leg-press-1.webp',
      '/pictures/leg-press-2.webp',
    ])
    for (const picture of pictures) {
      expect(picture).toHaveAttribute('width', '400')
      expect(picture).toHaveAttribute('height', '400')
      expect(picture).toHaveAttribute('decoding', 'async')
    }
  })

  it.each([
    [true, 'eager', 'high'],
    [false, 'lazy', null],
  ])('with eager=%s loads its pictures %s, at priority %s', (eager, loading, priority) => {
    render(<ExerciseCard prescription={prescription(legPress, 4, 10)} eager={eager} />)
    for (const picture of screen.getAllByRole('img')) {
      expect(picture).toHaveAttribute('loading', loading)
      expect(picture.getAttribute('fetchpriority')).toBe(priority)
    }
  })

  it('reads the prescription, with the set count and the reps each in their own element', () => {
    render(<ExerciseCard prescription={prescription(legPress, 3, { min: 8, max: 12 }, 'leg')} eager />)
    const line = screen.getByTestId('prescription')
    expect(line).toHaveTextContent(/^3 sets × 8–12 reps per leg$/)
    expect(within(line).getByTestId('sets')).toHaveTextContent(/^3$/)
    expect(within(line).getByTestId('reps')).toHaveTextContent(/^8–12$/)
  })

  it('uses the singular for one set of one rep', () => {
    render(<ExerciseCard prescription={prescription(legPress, 1, 1)} eager />)
    expect(screen.getByTestId('prescription')).toHaveTextContent(/^1 set × 1 rep$/)
  })
})
