// Domain vocabulary for planned workouts, mirroring ADR-260001: a plan is an ordered list of planned
// days; a day is an ordered list of prescriptions; a prescription names an exercise, its sets and reps.
// Feature code speaks only these terms — never file formats or backend atoms.

/** Reps counted for each side separately: "per leg", "per arm", "per side" (ADR-260008). */
export type RepSide = 'leg' | 'arm' | 'side'

/** A target rep count; `min === max` when the plan names a single count rather than a range. */
export interface RepTarget {
  readonly min: number
  readonly max: number
}

export interface Picture {
  readonly src: string
  readonly alt: string
}

export interface Exercise {
  readonly key: string
  readonly name: string
  /** One-line coaching cue — `exercise/v1`'s description in the backend shape. */
  readonly cue?: string
  /** Exactly two pictures of how to do the exercise, in order. */
  readonly pictures: readonly [Picture, Picture]
}

export interface Prescription {
  readonly exercise: Exercise
  readonly sets: number
  readonly reps: RepTarget
  readonly per?: RepSide
}

export interface PlannedDay {
  readonly id: string
  readonly name: string
  readonly prescriptions: readonly Prescription[]
}

export interface WorkoutPlan {
  /** Planned days in the order they are paged. */
  readonly days: readonly PlannedDay[]
}
