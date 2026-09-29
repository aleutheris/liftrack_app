import {
  expected,
  isObject,
  isPositiveInteger,
  isSlug,
  isText,
  unknownFields,
  unless,
} from './json-checks'
import { PER_SIDES } from './raw-content'

const PER_VALUES: readonly unknown[] = PER_SIDES
// '"leg", "arm" or "side"', written from PER_SIDES so the message lists exactly the values accepted.
const quotedSides = PER_SIDES.map((side) => JSON.stringify(side))
const PER_EXPECTATION = `${quotedSides.slice(0, -1).join(', ')} or ${quotedSides.at(-1)}`

/** Checks content/plan.json against ADR-260008's plan format and the catalogue's exercise slugs. */
export function validatePlan(plan: unknown, exerciseSlugs: ReadonlySet<string>): string[] {
  if (!isObject(plan)) {
    return [expected('plan.json', 'an object with "workouts"', plan)]
  }
  const { workouts } = plan
  const fieldProblems = unknownFields('plan.json', plan, ['workouts'])
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return [...fieldProblems, expected('plan.json workouts', 'a non-empty list of workouts', workouts)]
  }
  return [
    ...fieldProblems,
    ...workouts.flatMap((workout, index) => validateWorkout(`plan.json workouts[${index}]`, workout, exerciseSlugs)),
    ...repeatedIds(workouts),
  ]
}

function validateWorkout(location: string, workout: unknown, exerciseSlugs: ReadonlySet<string>): string[] {
  if (!isObject(workout)) {
    return [expected(location, 'an object with "id", "name" and "exercises"', workout)]
  }
  const rows = workout.exercises
  const rowProblems =
    Array.isArray(rows) && rows.length > 0
      ? rows.flatMap((row, index) => validateRow(`${location}.exercises[${index}]`, row, exerciseSlugs))
      : [expected(`${location}.exercises`, 'a non-empty list of exercises', rows)]
  return [
    ...unknownFields(location, workout, ['id', 'name', 'exercises']),
    ...unless(isSlug(workout.id), expected(`${location}.id`, 'a slug such as "workout-1"', workout.id)),
    ...unless(isText(workout.name), expected(`${location}.name`, 'a non-empty string', workout.name)),
    ...rowProblems,
  ]
}

function validateRow(location: string, row: unknown, exerciseSlugs: ReadonlySet<string>): string[] {
  if (!isObject(row)) {
    return [expected(location, 'an object with "exercise", "sets" and "reps"', row)]
  }
  return [
    ...unknownFields(location, row, ['exercise', 'sets', 'reps', 'per']),
    ...validateExerciseSlug(`${location}.exercise`, row.exercise, exerciseSlugs),
    ...unless(isPositiveInteger(row.sets), expected(`${location}.sets`, 'a positive integer', row.sets)),
    ...validateReps(`${location}.reps`, row.reps),
    ...unless(
      row.per === undefined || PER_VALUES.includes(row.per),
      expected(`${location}.per`, PER_EXPECTATION, row.per),
    ),
  ]
}

function validateExerciseSlug(
  location: string,
  slug: unknown,
  exerciseSlugs: ReadonlySet<string>,
): string[] {
  if (typeof slug !== 'string') {
    return [expected(location, 'an exercise slug', slug)]
  }
  return unless(exerciseSlugs.has(slug), `${location}: ${JSON.stringify(slug)} is not in exercises.json`)
}

function validateReps(location: string, reps: unknown): string[] {
  if (isPositiveInteger(reps)) {
    return []
  }
  if (!isObject(reps)) {
    return [expected(location, 'a positive integer or { "min", "max" }', reps)]
  }
  const { min, max } = reps
  const orderProblems =
    isPositiveInteger(min) && isPositiveInteger(max) && min > max
      ? [`${location}: min ${min} is greater than max ${max}`]
      : []
  return [
    ...unknownFields(location, reps, ['min', 'max']),
    ...unless(isPositiveInteger(min), expected(`${location}.min`, 'a positive integer', min)),
    ...unless(isPositiveInteger(max), expected(`${location}.max`, 'a positive integer', max)),
    ...orderProblems,
  ]
}

function repeatedIds(workouts: readonly unknown[]): string[] {
  const firstIndexById = new Map<string, number>()
  return workouts.flatMap((workout, index) => {
    const id = isObject(workout) ? workout.id : undefined
    if (typeof id !== 'string') return []
    const firstIndex = firstIndexById.get(id)
    if (firstIndex === undefined) {
      firstIndexById.set(id, index)
      return []
    }
    return [`plan.json workouts[${index}].id: ${JSON.stringify(id)} is already used by workouts[${firstIndex}]`]
  })
}
