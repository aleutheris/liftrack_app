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
      [['plan', 'days', 0, 'name'], undefined],
      [['plan', 'days', 0, 'nmae'], 'Day 1 — type A'],
    )

    expect(validateContent(content)).toEqual([
      'plan.json days[0]: unknown field "nmae"',
      'plan.json days[0].name: expected a non-empty string, found nothing',
    ])
  })

  it('reports every problem in both files, not only the first', () => {
    const content = contentWith(
      [['exercises', 'pallof-press', 'cue'], ''],
      [['plan', 'days', 1, 'exercises', 0, 'sets'], 0],
      [['plan', 'days', 1, 'id'], 'day-1'],
    )

    expect(validateContent(content)).toEqual([
      'exercises.json pallof-press.cue: expected a non-empty string, found ""',
      'plan.json days[1].exercises[0].sets: expected a positive integer, found 0',
      'plan.json days[1].id: "day-1" is already used by days[0]',
    ])
  })
})
