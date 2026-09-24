// The content file formats of ADR-260008, as written by hand in content/. Values only take these
// types after validateContent has passed them; nothing else makes the cast safe.

export const PER_SIDES = ['leg', 'arm', 'side'] as const

/** A single rep count, or a `{ min, max }` range. */
export type RawReps = number | { readonly min: number; readonly max: number }

/** An entry of content/exercises.json. */
export interface RawExercise {
  readonly name: string
  readonly cue?: string
  /** Up to two file names in content/pictures/, in order; absent until a photo is added. */
  readonly pictures?: readonly string[]
}

/** content/exercises.json: exercise slug → exercise. */
export type RawCatalogue = Readonly<Record<string, RawExercise>>

/** A row of a planned day; `exercise` is a slug of content/exercises.json. */
export interface RawRow {
  readonly exercise: string
  readonly sets: number
  readonly reps: RawReps
  readonly per?: (typeof PER_SIDES)[number]
}

export interface RawDay {
  readonly id: string
  readonly name: string
  readonly exercises: readonly RawRow[]
}

/** content/plan.json: the planned days in paging order. */
export interface RawPlan {
  readonly days: readonly RawDay[]
}
