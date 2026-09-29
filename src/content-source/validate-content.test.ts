import { contentWith } from './test-support/content-fixture'
import { validateContent } from './validate-content'

describe('validateContent', () => {
  it('passes valid content: single counts, ranges, per side, and an optional cue', () => {
    expect(validateContent(contentWith())).toEqual([])
  })

  it.each(['.webp', '.jpg', '.jpeg', '.png', '.avif', '.svg'])('accepts a %s picture', (extension) => {
    const fileName = `leg-press-1${extension}`
    const content = contentWith(
      [['exercises', 'leg-press', 'pictures', 0], fileName],
      [['pictureSizes', fileName], 2_000],
    )

    expect(validateContent(content)).toEqual([])
  })

  it('accepts a picture of exactly 102400 bytes', () => {
    expect(validateContent(contentWith([['pictureSizes', 'leg-press-1.webp'], 102_400]))).toEqual([])
  })

  it('checks only that a picture exists when its size is unknown, as in the browser', () => {
    expect(validateContent(contentWith([['pictureSizes', 'leg-press-1.webp'], null]))).toEqual([])
  })

  it('catches a misspelt key rather than ignoring it', () => {
    const content = contentWith(
      [['plan', 'workouts', 0, 'name'], undefined],
      [['plan', 'workouts', 0, 'nmae'], 'Workout 1 — type A'],
    )

    expect(validateContent(content)).toEqual([
      'plan.json workouts[0]: unknown field "nmae"',
      'plan.json workouts[0].name: expected a non-empty string, found nothing',
    ])
  })

  it('reports every problem in both files, not only the first', () => {
    const content = contentWith(
      [['exercises', 'pallof-press', 'cue'], ''],
      [['plan', 'workouts', 1, 'exercises', 0, 'sets'], 0],
      [['plan', 'workouts', 1, 'id'], 'workout-1'],
    )

    expect(validateContent(content)).toEqual([
      'exercises.json pallof-press.cue: expected a non-empty string, found ""',
      'plan.json workouts[1].exercises[0].sets: expected a positive integer, found 0',
      'plan.json workouts[1].id: "workout-1" is already used by workouts[0]',
    ])
  })
})
