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
    return [expected('plan.json', 'an object with "days"', plan)]
  }
  const { days } = plan
  const fieldProblems = unknownFields('plan.json', plan, ['days'])
  if (!Array.isArray(days) || days.length === 0) {
    return [...fieldProblems, expected('plan.json days', 'a non-empty list of days', days)]
  }
  return [
    ...fieldProblems,
    ...days.flatMap((day, index) => validateDay(`plan.json days[${index}]`, day, exerciseSlugs)),
    ...repeatedIds(days),
  ]
}

function validateDay(location: string, day: unknown, exerciseSlugs: ReadonlySet<string>): string[] {
  if (!isObject(day)) {
    return [expected(location, 'an object with "id", "name" and "exercises"', day)]
  }
  const rows = day.exercises
  const rowProblems =
    Array.isArray(rows) && rows.length > 0
      ? rows.flatMap((row, index) => validateRow(`${location}.exercises[${index}]`, row, exerciseSlugs))
      : [expected(`${location}.exercises`, 'a non-empty list of exercises', rows)]
  return [
    ...unknownFields(location, day, ['id', 'name', 'exercises']),
    ...unless(isSlug(day.id), expected(`${location}.id`, 'a slug such as "day-1"', day.id)),
    ...unless(isText(day.name), expected(`${location}.name`, 'a non-empty string', day.name)),
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

function repeatedIds(days: readonly unknown[]): string[] {
  const firstIndexById = new Map<string, number>()
  return days.flatMap((day, index) => {
    const id = isObject(day) ? day.id : undefined
    if (typeof id !== 'string') return []
    const firstIndex = firstIndexById.get(id)
    if (firstIndex === undefined) {
      firstIndexById.set(id, index)
      return []
    }
    return [`plan.json days[${index}].id: ${JSON.stringify(id)} is already used by days[${firstIndex}]`]
  })
}
