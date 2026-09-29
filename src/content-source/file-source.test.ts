import { contentWith, type Edit } from './test-support/content-fixture'
import { createFileSource } from './file-source'

// The build hands the source its pictures as import.meta.glob does: module path → served URL.
function sourceWith(...edits: readonly Edit[]) {
  const { exercises, groups, plan, pictureSizes } = contentWith(...edits)
  const pictureModules = Object.fromEntries(
    [...pictureSizes.keys()].map((fileName) => [
      `../../content/pictures/${fileName}`,
      `/assets/${fileName}?v=1`,
    ]),
  )
  return createFileSource({ exercises, groups, plan, pictureModules })
}

describe('createFileSource', () => {
  it('resolves the decoded plan, with each picture at the URL the build serves it from', async () => {
    const plan = await sourceWith().loadPlan()

    expect(plan.workouts.map((workout) => workout.id)).toEqual(['workout-1', 'workout-2'])
    expect(plan.workouts[0]?.prescriptions[1]?.exercise.pictures).toEqual([
      { src: '/assets/pallof-press-1.png?v=1', alt: 'Pallof press — picture 1 of 2' },
      { src: '/assets/pallof-press-2.svg?v=1', alt: 'Pallof press — picture 2 of 2' },
    ])
  })

  it('rejects with an error listing every problem when the content is invalid', async () => {
    const source = sourceWith(
      [['plan', 'workouts', 0, 'id'], 'Workout 1'],
      [['exercises', 'leg-press', 'name'], ''],
    )

    await expect(source.loadPlan()).rejects.toThrow(
      new Error(
        [
          'The content has 2 problem(s):',
          'exercises.json leg-press.name: expected a non-empty string, found ""',
          'plan.json workouts[0].id: expected a slug such as "workout-1", found "Workout 1"',
        ].join('\n'),
      ),
    )
  })

  // The CI content check still fails such a picture, so a typo cannot deploy (catalogue-defects.test.ts).
  it('shows a picture named but not in content/pictures/ as missing, rather than failing every workout', async () => {
    const plan = await sourceWith([['pictureSizes', 'leg-press-2.jpg'], undefined]).loadPlan()

    expect(plan.workouts[0]?.prescriptions[0]?.exercise.pictures).toEqual([
      { src: '/assets/leg-press-1.webp?v=1', alt: 'Leg press — picture 1 of 2' },
      null,
    ])
  })

  it('still rejects a picture name the format forbids, whether or not the file exists', async () => {
    const source = sourceWith([['exercises', 'leg-press', 'pictures', 1], 'leg-press-2.gif'])

    await expect(source.loadPlan()).rejects.toThrow(
      'exercises.json leg-press.pictures[1]: "leg-press-2.gif" is not a .webp, .jpg, .jpeg, .png, .avif, .svg file',
    )
  })
})
