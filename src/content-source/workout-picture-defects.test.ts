import { validateContent, type ContentFiles } from './validate-content'

// Negative controls for the pictures one workout needs (REQ-QR-260002, EPIC-260007). Every workout in
// content/plan.json has seven exercises, so 14 pictures, which cannot reach the 600 KB workout budget
// while each picture stays inside its own 40 KB budget: eight exercises is the smallest workout that can
// break the total on pictures the picture check accepts.
const EXERCISES = 8
// Sixteen pictures of this size are 614400 bytes — the workout budget to the byte.
const EVEN_SHARE = 38_400

interface Workout {
  /** How many exercises the workout prescribes, each naming two pictures. */
  readonly exercises: number
  /** Makes the workout's last exercise name its first exercise's picture: one file, two exercises. */
  readonly shared?: boolean
}

interface Entry {
  readonly slug: string
  readonly pictures: readonly [string, string]
}

/** Valid content, one workout per entry, where every picture file is `bytesOf(file)` bytes. */
function contentOf(workouts: readonly Workout[], bytesOf: (file: string) => number | null): ContentFiles {
  const perWorkout = workouts.map((workout, index) => entriesOf(index + 1, workout))
  const entries = perWorkout.flat()
  return {
    exercises: Object.fromEntries(entries.map((e) => [e.slug, { name: e.slug, pictures: e.pictures }])),
    plan: {
      workouts: perWorkout.map((workoutEntries, index) => ({
        id: `workout-${index + 1}`,
        name: `Workout ${index + 1}`,
        exercises: workoutEntries.map((e) => ({ exercise: e.slug, sets: 3, reps: 10 })),
      })),
    },
    pictureSizes: new Map([...new Set(entries.flatMap((e) => e.pictures))].map((f) => [f, bytesOf(f)])),
  }
}

/** The workout's exercises, each naming two files of its own: `d1p0.webp`, `d1p1.webp`, and so on. */
function entriesOf(workout: number, { exercises, shared = false }: Workout): Entry[] {
  const file = (index: number) => `d${workout}p${index}.webp`
  return Array.from({ length: exercises }, (_, index): Entry => ({
    slug: `d${workout}-exercise-${index + 1}`,
    pictures: [file(2 * index), shared && index === exercises - 1 ? file(0) : file(2 * index + 1)],
  }))
}

function overBudget(index: number, bytes: number): string {
  const at = `plan.json workouts[${index}]: workout "workout-${index + 1}"`
  return `${at} needs ${bytes} bytes of pictures, over the 614400-byte workout budget`
}

describe('validateContent — the pictures one workout needs', () => {
  it('accepts a workout whose pictures are exactly the 614400-byte budget', () => {
    expect(validateContent(contentOf([{ exercises: EXERCISES }], () => EVEN_SHARE))).toEqual([])
  })

  it('rejects a workout whose pictures are one byte over the budget, naming the workout', () => {
    const content = contentOf([{ exercises: EXERCISES }], (file) =>
      file === 'd1p0.webp' ? EVEN_SHARE + 1 : EVEN_SHARE,
    )

    expect(validateContent(content)).toEqual([overBudget(0, 614_401)])
  })

  it('counts a file two exercises of one workout share once, as the browser fetches it once', () => {
    // Fifteen files at the 40960-byte picture budget are 614400 bytes, so the workout that shares one
    // fits, where the workout of sixteen separate files is 40960 bytes over.
    const workouts = [{ exercises: EXERCISES, shared: true }, { exercises: EXERCISES }]

    expect(validateContent(contentOf(workouts, () => 40_960))).toEqual([overBudget(1, 655_360)])
  })

  it('leaves a size it cannot read out of the total, as every size is unknown in the browser', () => {
    expect(validateContent(contentOf([{ exercises: EXERCISES }], () => null))).toEqual([])
  })

  it('does not count a size it cannot read as a picture of the full budget', () => {
    // Fifteen pictures one byte over an even share are 576015 bytes; counting the sixteenth, whose
    // size is unknown, as a 40960-byte picture would put the workout over.
    const content = contentOf([{ exercises: EXERCISES }], (file) =>
      file === 'd1p0.webp' ? null : EVEN_SHARE + 1,
    )

    expect(validateContent(content)).toEqual([])
  })

  it('reports a picture over its own budget without a workout total resting on that picture', () => {
    // The workout comes to 616961 bytes, over its budget — but the one picture is the fix, and the total
    // changes the moment it is resized, so a workout message here would be noise.
    const content = contentOf([{ exercises: EXERCISES }], (file) =>
      file === 'd1p0.webp' ? 40_961 : EVEN_SHARE,
    )

    expect(validateContent(content)).toEqual([
      'exercises.json d1-exercise-1.pictures[0]: "d1p0.webp" is 40961 bytes, over the 40960-byte picture budget',
    ])
  })
})
