import type { Exercise, PlannedDay, Prescription, RepTarget, WorkoutPlan } from '../workout/types'
import type { RawCatalogue, RawDay, RawExercise, RawPlan, RawReps, RawRow } from './raw-content'

/** Resolves a file name in content/pictures/ to the URL the build serves it at. */
type PictureUrl = (fileName: string) => string

/** Turns content that validateContent has passed into the domain plan, in file order. */
export function decodePlan(catalogue: RawCatalogue, plan: RawPlan, pictureUrl: PictureUrl): WorkoutPlan {
  const exercises = new Map(
    Object.entries(catalogue).map(([slug, raw]) => [slug, decodeExercise(slug, raw, pictureUrl)]),
  )
  return { days: plan.days.map((day) => decodeDay(day, exercises)) }
}

function decodeExercise(slug: string, raw: RawExercise, pictureUrl: PictureUrl): Exercise {
  const picture = (index: 0 | 1) => ({
    src: pictureUrl(raw.pictures[index]),
    alt: `${raw.name} — picture ${index + 1} of 2`,
  })
  return {
    key: slug,
    name: raw.name,
    ...(raw.cue === undefined ? {} : { cue: raw.cue }),
    pictures: [picture(0), picture(1)],
  }
}

function decodeDay(day: RawDay, exercises: ReadonlyMap<string, Exercise>): PlannedDay {
  return {
    id: day.id,
    name: day.name,
    prescriptions: day.exercises.map((row) => decodeRow(row, exercises)),
  }
}

function decodeRow(row: RawRow, exercises: ReadonlyMap<string, Exercise>): Prescription {
  const exercise = exercises.get(row.exercise)
  if (exercise === undefined) {
    throw new Error(`plan.json names exercise "${row.exercise}", which exercises.json does not define`)
  }
  return {
    exercise,
    sets: row.sets,
    reps: decodeReps(row.reps),
    ...(row.per === undefined ? {} : { per: row.per }),
  }
}

function decodeReps(reps: RawReps): RepTarget {
  return typeof reps === 'number' ? { min: reps, max: reps } : { min: reps.min, max: reps.max }
}
