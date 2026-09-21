import { describePrescription } from './describe-prescription'

// Joined the way ExerciseCard lays the pieces out, so each case reads as the page shows it.
function shown(sets: number, min: number, max: number, per?: 'leg' | 'arm' | 'side') {
  const text = describePrescription({ sets, reps: { min, max }, per })
  return `${text.sets} ${text.setsUnit} × ${text.reps} ${text.repsUnit}`
}

describe('describePrescription', () => {
  it.each([
    [4, 10, 10, undefined, '4 sets × 10 reps'],
    [1, 1, 1, undefined, '1 set × 1 rep'],
    [1, 10, 10, undefined, '1 set × 10 reps'],
    [3, 1, 1, undefined, '3 sets × 1 rep'],
    [3, 8, 12, undefined, '3 sets × 8–12 reps'],
    [2, 1, 2, undefined, '2 sets × 1–2 reps'],
    [4, 10, 10, 'leg', '4 sets × 10 reps per leg'],
    [3, 15, 15, 'arm', '3 sets × 15 reps per arm'],
    [3, 12, 12, 'side', '3 sets × 12 reps per side'],
    [1, 1, 1, 'side', '1 set × 1 rep per side'],
    [3, 8, 12, 'leg', '3 sets × 8–12 reps per leg'],
  ] as const)('%i sets of %i–%i reps per %s reads "%s"', (sets, min, max, per, expected) => {
    expect(shown(sets, min, max, per)).toBe(expected)
  })

  it('keeps the two numbers apart from their words, so the view can enlarge them', () => {
    expect(describePrescription({ sets: 3, reps: { min: 8, max: 12 }, per: 'arm' })).toEqual({
      sets: '3',
      setsUnit: 'sets',
      reps: '8–12',
      repsUnit: 'reps per arm',
    })
  })

  it('writes a range with an en dash, not a hyphen', () => {
    expect(describePrescription({ sets: 3, reps: { min: 8, max: 12 } }).reps).toBe('8–12')
  })

  it('never calls sets "sequences"', () => {
    expect(shown(4, 10, 10)).not.toMatch(/sequence/i)
  })
})
