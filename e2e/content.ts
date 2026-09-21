import { readFileSync } from 'node:fs'

// Expectations are derived from the content files at test time, never written into the specs:
// the owner edits the days every week, and a hard-coded day would break on the first such commit.
// The format itself is enforced by the content check; this reads it as the page should.

type ContentReps = number | { min: number; max: number }

interface ContentRow {
  exercise: string
  sets: number
  reps: ContentReps
  per?: string
}

interface ContentDay {
  id: string
  name: string
  exercises: ContentRow[]
}

interface ContentExercise {
  name: string
  cue?: string
}

export interface ExpectedExercise {
  name: string
  cue?: string
  sets: string
  reps: string
  prescription: string
}

export interface ExpectedDay {
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
  }
}

/** Every planned day in paging order, as the page should show it. */
export function readExpectedDays(): ExpectedDay[] {
  const catalogue = readContent<Record<string, ContentExercise>>('exercises.json')
  const { days } = readContent<{ days: ContentDay[] }>('plan.json')
  return days.map((day) => ({
    id: day.id,
    name: day.name,
    exercises: day.exercises.map((row) => expectedExercise(row, catalogue)),
  }))
}
