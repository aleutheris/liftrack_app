import { contentWith, type Path } from './test-support/content-fixture'
import { validateContent } from './validate-content'

// Negative controls for plan.json (ADR-260008): each case changes one value of valid content, and the
// check must report exactly that defect.
const DAY = ['plan', 'days', 0]
const ROW = [...DAY, 'exercises', 1]
const AT_ROW = 'plan.json days[0].exercises[1]'

describe('validateContent — plan.json defects', () => {
  it.each<[defect: string, path: Path, value: unknown, problem: string]>([
    [
      'a plan that is not an object', ['plan'], ['day-1'],
      'plan.json: expected an object with "days", found ["day-1"]',
    ],
    [
      'an unknown top-level field', ['plan', 'version'], 1,
      'plan.json: unknown field "version"',
    ],
    [
      'no days (an empty list)', ['plan', 'days'], [],
      'plan.json days: expected a non-empty list of days, found []',
    ],
    [
      'no days (no field)', ['plan', 'days'], undefined,
      'plan.json days: expected a non-empty list of days, found nothing',
    ],
    [
      'a day that is not an object', ['plan', 'days', 1], 'day-2',
      'plan.json days[1]: expected an object with "id", "name" and "exercises", found "day-2"',
    ],
    [
      'an unknown field on a day', [...DAY, 'notes'], 'Heavy',
      'plan.json days[0]: unknown field "notes"',
    ],
    [
      'a day id that is not a slug', [...DAY, 'id'], 'Day 1',
      'plan.json days[0].id: expected a slug such as "day-1", found "Day 1"',
    ],
    [
      'a day id with text after a space', [...DAY, 'id'], 'day-1 x',
      'plan.json days[0].id: expected a slug such as "day-1", found "day-1 x"',
    ],
    [
      'a day id with a capital letter', [...DAY, 'id'], 'Day-1',
      'plan.json days[0].id: expected a slug such as "day-1", found "Day-1"',
    ],
    [
      'a day id with an underscore', [...DAY, 'id'], 'day_1',
      'plan.json days[0].id: expected a slug such as "day-1", found "day_1"',
    ],
    [
      'a day id with a double hyphen', [...DAY, 'id'], 'day--1',
      'plan.json days[0].id: expected a slug such as "day-1", found "day--1"',
    ],
    [
      'a day id ending in a hyphen', [...DAY, 'id'], 'day-1-',
      'plan.json days[0].id: expected a slug such as "day-1", found "day-1-"',
    ],
    [
      'a day with no id', [...DAY, 'id'], undefined,
      'plan.json days[0].id: expected a slug such as "day-1", found nothing',
    ],
    [
      'a day id that appears twice', ['plan', 'days', 1, 'id'], 'day-1',
      'plan.json days[1].id: "day-1" is already used by days[0]',
    ],
    [
      'a day with an empty name', [...DAY, 'name'], ' ',
      'plan.json days[0].name: expected a non-empty string, found " "',
    ],
    [
      'a day with no name', [...DAY, 'name'], undefined,
      'plan.json days[0].name: expected a non-empty string, found nothing',
    ],
    [
      'a day with no exercises', [...DAY, 'exercises'], [],
      'plan.json days[0].exercises: expected a non-empty list of exercises, found []',
    ],
    [
      'a row that is not an object', ROW, 'pallof-press',
      `${AT_ROW}: expected an object with "exercise", "sets" and "reps", found "pallof-press"`,
    ],
    [
      'an unknown field on a row', [...ROW, 'weight'], 20,
      `${AT_ROW}: unknown field "weight"`,
    ],
    [
      'a row naming an unknown exercise', [...ROW, 'exercise'], 'pallof-pres',
      `${AT_ROW}.exercise: "pallof-pres" is not in exercises.json`,
    ],
    [
      'a row naming no exercise', [...ROW, 'exercise'], undefined,
      `${AT_ROW}.exercise: expected an exercise slug, found nothing`,
    ],
    [
      'sets of zero', [...ROW, 'sets'], 0,
      `${AT_ROW}.sets: expected a positive integer, found 0`,
    ],
    [
      'sets that are not whole', [...ROW, 'sets'], 2.5,
      `${AT_ROW}.sets: expected a positive integer, found 2.5`,
    ],
    [
      'negative reps', [...ROW, 'reps'], -10,
      `${AT_ROW}.reps: expected a positive integer or { "min", "max" }, found -10`,
    ],
    [
      'reps written as text', [...ROW, 'reps'], '10',
      `${AT_ROW}.reps: expected a positive integer or { "min", "max" }, found "10"`,
    ],
    [
      'a range whose min exceeds its max', [...ROW, 'reps'], { min: 12, max: 8 },
      `${AT_ROW}.reps: min 12 is greater than max 8`,
    ],
    [
      'a range min of zero', [...ROW, 'reps'], { min: 0, max: 12 },
      `${AT_ROW}.reps.min: expected a positive integer, found 0`,
    ],
    [
      'a range max that is not whole', [...ROW, 'reps'], { min: 8, max: 12.5 },
      `${AT_ROW}.reps.max: expected a positive integer, found 12.5`,
    ],
    [
      'an unknown field on a range', [...ROW, 'reps'], { min: 8, max: 12, step: 2 },
      `${AT_ROW}.reps: unknown field "step"`,
    ],
    [
      'a per other than leg, arm or side', [...ROW, 'per'], 'foot',
      `${AT_ROW}.per: expected "leg", "arm" or "side", found "foot"`,
    ],
  ])('rejects %s', (_defect, path, value, problem) => {
    expect(validateContent(contentWith([path, value]))).toEqual([problem])
  })
})
