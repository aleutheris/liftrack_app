import { contentWith, type Path } from './test-support/content-fixture'
import { validateContent } from './validate-content'

// Negative controls for exercise-groups.json and the exercises.json "group" reference (ADR-260008
// amendment, 2026-09-24): extra info about an exercise, so absence is fine throughout — only a
// value that IS given must be right.
const LEG_PRESS = ['exercises', 'leg-press']
const AT = 'exercises.json leg-press'

describe('validateContent — exercise-groups.json and the group reference', () => {
  it('rejects a groups file that is not an object, and so every exercise naming a group', () => {
    expect(validateContent(contentWith([['groups'], ['legs']]))).toEqual([
      'exercise-groups.json: expected an object keyed by group slug, found ["legs"]',
      `${AT}.group: "legs" is not in exercise-groups.json`,
      'exercises.json pallof-press.group: "core" is not in exercise-groups.json',
    ])
  })

  it.each<[defect: string, path: Path, value: unknown, problem: string]>([
    [
      'a group key that is not a slug', ['groups', 'Legs'], { name: 'Legs' },
      'exercise-groups.json Legs: "Legs" is not a slug such as "legs"',
    ],
    [
      'a group entry that is not an object', ['groups', 'legs'], 'Legs',
      'exercise-groups.json legs: expected an object with "name", found "Legs"',
    ],
    [
      'an unknown field on a group', ['groups', 'legs', 'order'], 1,
      'exercise-groups.json legs: unknown field "order"',
    ],
    [
      'a group with no name', ['groups', 'legs', 'name'], undefined,
      'exercise-groups.json legs.name: expected a non-empty string, found nothing',
    ],
    [
      'a group with an empty name', ['groups', 'legs', 'name'], '',
      'exercise-groups.json legs.name: expected a non-empty string, found ""',
    ],
    [
      'an exercise group that is not a string', [...LEG_PRESS, 'group'], 7,
      `${AT}.group: expected a group slug, found 7`,
    ],
    [
      'an exercise group that no group defines', [...LEG_PRESS, 'group'], 'shoulders',
      `${AT}.group: "shoulders" is not in exercise-groups.json`,
    ],
  ])('rejects %s', (_defect, path, value, problem) => {
    expect(validateContent(contentWith([path, value]))).toEqual([problem])
  })

  it('accepts an exercise with no group at all, like a cue not yet written', () => {
    expect(validateContent(contentWith([[...LEG_PRESS, 'group'], undefined]))).toEqual([])
  })

  it('accepts content with no exercise-groups.json at all, as grouping is extra info', () => {
    const content = contentWith(
      [['groups'], undefined],
      [[...LEG_PRESS, 'group'], undefined],
      [['exercises', 'pallof-press', 'group'], undefined],
    )

    expect(validateContent(content)).toEqual([])
  })
})
