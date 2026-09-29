import { contentWith, type Path } from './test-support/content-fixture'
import { validateContent } from './validate-content'

// Negative controls for plan.json (ADR-260008): each case changes one value of valid content, and the
// check must report exactly that defect.
const WORKOUT = ['plan', 'workouts', 0]
const ROW = [...WORKOUT, 'exercises', 1]
const AT_ROW = 'plan.json workouts[0].exercises[1]'

describe('validateContent — plan.json defects', () => {
  it.each<[defect: string, path: Path, value: unknown, problem: string]>([
    [
      'a plan that is not an object', ['plan'], ['workout-1'],
      'plan.json: expected an object with "workouts", found ["workout-1"]',
    ],
    [
      'an unknown top-level field', ['plan', 'version'], 1,
      'plan.json: unknown field "version"',
    ],
    [
      'no workouts (an empty list)', ['plan', 'workouts'], [],
      'plan.json workouts: expected a non-empty list of workouts, found []',
    ],
    [
      'no workouts (no field)', ['plan', 'workouts'], undefined,
      'plan.json workouts: expected a non-empty list of workouts, found nothing',
    ],
    [
      'a workout that is not an object', ['plan', 'workouts', 1], 'workout-2',
      'plan.json workouts[1]: expected an object with "id", "name" and "exercises", found "workout-2"',
    ],
    [
      'an unknown field on a workout', [...WORKOUT, 'notes'], 'Heavy',
      'plan.json workouts[0]: unknown field "notes"',
    ],
    [
      'a workout id that is not a slug', [...WORKOUT, 'id'], 'Workout 1',
      'plan.json workouts[0].id: expected a slug such as "workout-1", found "Workout 1"',
    ],
    [
      'a workout id with text after a space', [...WORKOUT, 'id'], 'workout-1 x',
      'plan.json workouts[0].id: expected a slug such as "workout-1", found "workout-1 x"',
    ],
    [
      'a workout id with a capital letter', [...WORKOUT, 'id'], 'Workout-1',
      'plan.json workouts[0].id: expected a slug such as "workout-1", found "Workout-1"',
    ],
    [
      'a workout id with an underscore', [...WORKOUT, 'id'], 'workout_1',
      'plan.json workouts[0].id: expected a slug such as "workout-1", found "workout_1"',
    ],
    [
      'a workout id with a double hyphen', [...WORKOUT, 'id'], 'workout--1',
      'plan.json workouts[0].id: expected a slug such as "workout-1", found "workout--1"',
    ],
    [
      'a workout id ending in a hyphen', [...WORKOUT, 'id'], 'workout-1-',
      'plan.json workouts[0].id: expected a slug such as "workout-1", found "workout-1-"',
    ],
    [
      'a workout with no id', [...WORKOUT, 'id'], undefined,
      'plan.json workouts[0].id: expected a slug such as "workout-1", found nothing',
    ],
    [
      'a workout id that appears twice', ['plan', 'workouts', 1, 'id'], 'workout-1',
      'plan.json workouts[1].id: "workout-1" is already used by workouts[0]',
    ],
    [
      'a workout with an empty name', [...WORKOUT, 'name'], ' ',
      'plan.json workouts[0].name: expected a non-empty string, found " "',
    ],
    [
      'a workout with no name', [...WORKOUT, 'name'], undefined,
      'plan.json workouts[0].name: expected a non-empty string, found nothing',
    ],
    [
      'a workout with no exercises', [...WORKOUT, 'exercises'], [],
      'plan.json workouts[0].exercises: expected a non-empty list of exercises, found []',
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
