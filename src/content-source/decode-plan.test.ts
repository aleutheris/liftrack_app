import { decodePlan } from './decode-plan'
import type { RawCatalogue, RawPlan } from './raw-content'

const catalogue: RawCatalogue = {
  'leg-press': {
    name: 'Leg press',
    cue: 'Feet mid-platform, knees track over toes',
    pictures: ['leg-press-1.webp', 'leg-press-2.webp'],
  },
  'pallof-press': { name: 'Pallof press', pictures: ['pallof-press-1.svg', 'pallof-press-2.svg'] },
}

const plan: RawPlan = {
  workouts: [
    {
      id: 'workout-1',
      name: 'Workout 1 — type A',
      exercises: [
        { exercise: 'leg-press', sets: 4, reps: 10 },
        { exercise: 'pallof-press', sets: 3, reps: { min: 8, max: 12 }, per: 'side' },
      ],
    },
    {
      id: 'workout-2',
      name: 'Workout 2 — type B',
      exercises: [{ exercise: 'pallof-press', sets: 1, reps: 1, per: 'arm' }],
    },
  ],
}

const pictureUrl = (fileName: string) => `/assets/${fileName}`

describe('decodePlan', () => {
  const decoded = decodePlan(catalogue, plan, pictureUrl)
  const [workoutOne, workoutTwo] = decoded.workouts

  it('keeps the workouts and each workout’s rows in file order', () => {
    expect(decoded.workouts.map((workout) => [workout.id, workout.name])).toEqual([
      ['workout-1', 'Workout 1 — type A'],
      ['workout-2', 'Workout 2 — type B'],
    ])
    expect(workoutOne?.prescriptions.map((row) => row.exercise.key)).toEqual(['leg-press', 'pallof-press'])
  })

  it('turns a single rep count into a target whose min equals its max, and keeps a range', () => {
    expect(workoutOne?.prescriptions.map((row) => [row.sets, row.reps])).toEqual([
      [4, { min: 10, max: 10 }],
      [3, { min: 8, max: 12 }],
    ])
  })

  it('keeps per where the content sets it, and leaves it out elsewhere', () => {
    expect(workoutOne?.prescriptions[0]).not.toHaveProperty('per')
    expect(workoutOne?.prescriptions[1]?.per).toBe('side')
    expect(workoutTwo?.prescriptions[0]?.per).toBe('arm')
  })

  it('decodes an exercise with its slug as key, its cue when it has one, and two described pictures', () => {
    expect(workoutOne?.prescriptions[0]?.exercise).toEqual({
      key: 'leg-press',
      name: 'Leg press',
      cue: 'Feet mid-platform, knees track over toes',
      pictures: [
        { src: '/assets/leg-press-1.webp', alt: 'Leg press — picture 1 of 2' },
        { src: '/assets/leg-press-2.webp', alt: 'Leg press — picture 2 of 2' },
      ],
    })
    expect(workoutTwo?.prescriptions[0]?.exercise).not.toHaveProperty('cue')
  })

  // Photos arrive one at a time, so a slot may be empty; the page shows it as missing.
  it.each<[said: string, pictures: string[] | undefined, slots: unknown[]]>([
    ['one picture', ['leg-press-1.webp'], [{ src: '/assets/leg-press-1.webp', alt: 'Leg press — picture 1 of 2' }, null]],
    ['an empty list', [], [null, null]],
    ['no pictures field', undefined, [null, null]],
  ])('leaves a slot empty for an exercise with %s', (_said, pictures, slots) => {
    const withPictures: RawCatalogue = { ...catalogue, 'leg-press': { name: 'Leg press', ...(pictures && { pictures }) } }

    const [workout] = decodePlan(withPictures, plan, pictureUrl).workouts

    expect(workout?.prescriptions[0]?.exercise.pictures).toEqual(slots)
  })

  it('leaves a slot empty for a picture the build serves no file for', () => {
    const served = (fileName: string) => (fileName === 'leg-press-1.webp' ? undefined : pictureUrl(fileName))

    const [workout] = decodePlan(catalogue, plan, served).workouts

    expect(workout?.prescriptions[0]?.exercise.pictures).toEqual([
      null,
      { src: '/assets/leg-press-2.webp', alt: 'Leg press — picture 2 of 2' },
    ])
  })

  it('refuses a row naming an exercise the catalogue lacks, rather than decoding an incomplete plan', () => {
    const unchecked: RawPlan = {
      workouts: [{ id: 'workout-1', name: 'Workout 1', exercises: [{ exercise: 'squat', sets: 1, reps: 1 }] }],
    }

    expect(() => decodePlan(catalogue, unchecked, pictureUrl)).toThrow(
      'plan.json names exercise "squat", which exercises.json does not define',
    )
  })
})
