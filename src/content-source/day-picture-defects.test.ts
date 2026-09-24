import { validateContent, type ContentFiles } from './validate-content'

// Negative controls for the pictures one day needs (REQ-QR-260002, EPIC-260007). Every day in
// content/plan.json has seven exercises, so 14 pictures, which cannot reach the 600 KB day budget
// while each picture stays inside its own 40 KB budget: eight exercises is the smallest day that can
// break the total on pictures the picture check accepts.
const EXERCISES = 8
// Sixteen pictures of this size are 614400 bytes — the day budget to the byte.
const EVEN_SHARE = 38_400

interface Day {
  /** How many exercises the day prescribes, each naming two pictures. */
  readonly exercises: number
  /** Makes the day's last exercise name its first exercise's picture: one file, two exercises. */
  readonly shared?: boolean
}

interface Entry {
  readonly slug: string
  readonly pictures: readonly [string, string]
}

/** Valid content, one day per entry, where every picture file is `bytesOf(file)` bytes. */
function contentOf(days: readonly Day[], bytesOf: (file: string) => number | null): ContentFiles {
  const perDay = days.map((day, index) => entriesOf(index + 1, day))
  const entries = perDay.flat()
  return {
    exercises: Object.fromEntries(entries.map((e) => [e.slug, { name: e.slug, pictures: e.pictures }])),
    plan: {
      days: perDay.map((dayEntries, index) => ({
        id: `day-${index + 1}`,
        name: `Day ${index + 1}`,
        exercises: dayEntries.map((e) => ({ exercise: e.slug, sets: 3, reps: 10 })),
      })),
    },
    pictureSizes: new Map([...new Set(entries.flatMap((e) => e.pictures))].map((f) => [f, bytesOf(f)])),
  }
}

/** The day's exercises, each naming two files of its own: `d1p0.webp`, `d1p1.webp`, and so on. */
function entriesOf(day: number, { exercises, shared = false }: Day): Entry[] {
  const file = (index: number) => `d${day}p${index}.webp`
  return Array.from({ length: exercises }, (_, index): Entry => ({
    slug: `d${day}-exercise-${index + 1}`,
    pictures: [file(2 * index), shared && index === exercises - 1 ? file(0) : file(2 * index + 1)],
  }))
}

function overBudget(index: number, bytes: number): string {
  const at = `plan.json days[${index}]: day "day-${index + 1}"`
  return `${at} needs ${bytes} bytes of pictures, over the 614400-byte day budget`
}

describe('validateContent — the pictures one day needs', () => {
  it('accepts a day whose pictures are exactly the 614400-byte budget', () => {
    expect(validateContent(contentOf([{ exercises: EXERCISES }], () => EVEN_SHARE))).toEqual([])
  })

  it('rejects a day whose pictures are one byte over the budget, naming the day', () => {
    const content = contentOf([{ exercises: EXERCISES }], (file) =>
      file === 'd1p0.webp' ? EVEN_SHARE + 1 : EVEN_SHARE,
    )

    expect(validateContent(content)).toEqual([overBudget(0, 614_401)])
  })

  it('counts a file two exercises of one day share once, as the browser fetches it once', () => {
    // Fifteen files at the 40960-byte picture budget are 614400 bytes, so the day that shares one
    // fits, where the day of sixteen separate files is 40960 bytes over.
    const days = [{ exercises: EXERCISES, shared: true }, { exercises: EXERCISES }]

    expect(validateContent(contentOf(days, () => 40_960))).toEqual([overBudget(1, 655_360)])
  })

  it('leaves a size it cannot read out of the total, as every size is unknown in the browser', () => {
    expect(validateContent(contentOf([{ exercises: EXERCISES }], () => null))).toEqual([])
  })

  it('does not count a size it cannot read as a picture of the full budget', () => {
    // Fifteen pictures one byte over an even share are 576015 bytes; counting the sixteenth, whose
    // size is unknown, as a 40960-byte picture would put the day over.
    const content = contentOf([{ exercises: EXERCISES }], (file) =>
      file === 'd1p0.webp' ? null : EVEN_SHARE + 1,
    )

    expect(validateContent(content)).toEqual([])
  })

  it('reports a picture over its own budget without a day total resting on that picture', () => {
    // The day comes to 616961 bytes, over its budget — but the one picture is the fix, and the total
    // changes the moment it is resized, so a day message here would be noise.
    const content = contentOf([{ exercises: EXERCISES }], (file) =>
      file === 'd1p0.webp' ? 40_961 : EVEN_SHARE,
    )

    expect(validateContent(content)).toEqual([
      'exercises.json d1-exercise-1.pictures[0]: "d1p0.webp" is 40961 bytes, over the 40960-byte picture budget',
    ])
  })
})
