import { readFileSync } from 'node:fs'

// Expectations are derived from the content files at test time, never written into the specs:
// the owner edits the workouts every week, and a hard-coded workout would break on the first such commit.
// The format itself is enforced by the content check; this reads it as the page should.

type ContentReps = number | { min: number; max: number }

interface ContentRow {
  exercise: string
  sets: number
  reps: ContentReps
  per?: string
}

interface ContentWorkout {
  id: string
  name: string
  exercises: ContentRow[]
}

interface ContentExercise {
  name: string
  cue?: string
  pictures?: string[]
}

export interface ExpectedExercise {
  name: string
  cue?: string
  sets: string
  reps: string
  prescription: string
  /** How many of the exercise's two picture slots hold a photo; the rest show as missing. */
  photos: number
}

export interface ExpectedWorkout {
  id: string
  name: string
  exercises: ExpectedExercise[]
}

function readContent<T>(fileName: string): T {
  return JSON.parse(readFileSync(new URL(`../content/${fileName}`, import.meta.url), 'utf8')) as T
}

function counted(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

function expectedExercise(row: ContentRow, catalogue: Record<string, ContentExercise>): ExpectedExercise {
  const exercise = catalogue[row.exercise]
  if (!exercise) throw new Error(`content/plan.json names an unknown exercise "${row.exercise}"`)
  const { min, max } = typeof row.reps === 'number' ? { min: row.reps, max: row.reps } : row.reps
  const reps = min === max ? String(min) : `${min}–${max}`
  const per = row.per ? ` per ${row.per}` : ''
  return {
    name: exercise.name,
    cue: exercise.cue,
    sets: String(row.sets),
    reps,
    prescription: `${row.sets} ${counted(row.sets, 'set')} × ${reps} ${counted(max, 'rep')}${per}`,
    photos: exercise.pictures?.length ?? 0,
  }
}

/** Every planned workout in paging order, as the page should show it. */
export function readExpectedWorkouts(): ExpectedWorkout[] {
  const catalogue = readContent<Record<string, ContentExercise>>('exercises.json')
  const { workouts } = readContent<{ workouts: ContentWorkout[] }>('plan.json')
  return workouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    exercises: workout.exercises.map((row) => expectedExercise(row, catalogue)),
  }))
}
