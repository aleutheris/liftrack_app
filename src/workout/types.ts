// Domain vocabulary for planned workouts, mirroring ADR-260001: a plan is an ordered list of planned
// workouts; a workout is an ordered list of prescriptions; a prescription names an exercise, its sets and reps.
// Feature code speaks only these terms — never file formats or backend atoms.

/** Reps counted for each side separately: "per leg", "per arm", "per side" (ADR-260008). */
export type RepSide = 'leg' | 'arm' | 'side'

/** A target rep count; `min === max` when the plan names a single count rather than a range. */
export interface RepTarget {
  readonly min: number
  readonly max: number
}

/** Who made a picture and under which license — shown with it, as attribution licenses require. */
export interface PictureCredit {
  readonly author: string
  readonly license: string
  readonly licenseUrl: string
  /** Where the picture was taken from. */
  readonly source: string
}

interface Picture {
  readonly src: string
  readonly alt: string
  /** Absent for the owner's own photos. */
  readonly credit?: PictureCredit
}

/** A picture of how to do the exercise, or `null` where no photo has been added yet (ADR-260008). */
type PictureSlot = Picture | null

export interface Exercise {
  readonly key: string
  readonly name: string
  /** One-line coaching cue — `exercise/v1`'s description in the backend shape. */
  readonly cue?: string
  /** Two picture slots, in order; a slot without a photo is shown as missing, not hidden. */
  readonly pictures: readonly [PictureSlot, PictureSlot]
}

export interface Prescription {
  readonly exercise: Exercise
  readonly sets: number
  readonly reps: RepTarget
  readonly per?: RepSide
}

export interface PlannedWorkout {
  readonly id: string
  readonly name: string
  readonly prescriptions: readonly Prescription[]
}

export interface WorkoutPlan {
  /** Planned workouts in the order they are paged. */
  readonly workouts: readonly PlannedWorkout[]
}

/** A section of the sets guide: a heading, then a table or a list of short lines. */
export interface GuideSection {
  readonly heading: string
  readonly table?: { readonly columns: readonly string[]; readonly rows: readonly (readonly string[])[] }
  readonly items?: readonly string[]
}

/** Text that belongs to every workout rather than to one exercise: how to do the sets (ICR-260005). */
export interface SetsGuide {
  readonly title: string
  readonly sections: readonly GuideSection[]
}
