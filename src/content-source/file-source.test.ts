import { contentWith, type Edit } from './test-support/content-fixture'
import { createFileSource } from './file-source'

// The build hands the source its pictures as import.meta.glob does: module path → served URL.
function sourceWith(...edits: readonly Edit[]) {
  const { exercises, plan, pictureSizes } = contentWith(...edits)
  const pictureModules = Object.fromEntries(
    [...pictureSizes.keys()].map((fileName) => [
      `../../content/pictures/${fileName}`,
      `/assets/${fileName}?v=1`,
    ]),
  )
  return createFileSource({ exercises, plan, pictureModules })
}

describe('createFileSource', () => {
  it('resolves the decoded plan, with each picture at the URL the build serves it from', async () => {
    const plan = await sourceWith().loadPlan()

    expect(plan.days.map((day) => day.id)).toEqual(['day-1', 'day-2'])
    expect(plan.days[0]?.prescriptions[1]?.exercise.pictures).toEqual([
      { src: '/assets/pallof-press-1.png?v=1', alt: 'Pallof press — picture 1 of 2' },
      { src: '/assets/pallof-press-2.svg?v=1', alt: 'Pallof press — picture 2 of 2' },
    ])
  })

  it('rejects with an error listing every problem when the content is invalid', async () => {
    const source = sourceWith(
      [['plan', 'days', 0, 'id'], 'Day 1'],
      [['pictureSizes', 'leg-press-2.jpg'], undefined],
    )

    await expect(source.loadPlan()).rejects.toThrow(
      new Error(
        [
          'The content has 2 problem(s):',
          'exercises.json leg-press.pictures[1]: "leg-press-2.jpg" is not in content/pictures/',
          'plan.json days[0].id: expected a slug such as "day-1", found "Day 1"',
        ].join('\n'),
      ),
    )
  })
})
