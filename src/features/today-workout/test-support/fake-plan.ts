import type { Exercise, PlannedDay, Prescription, RepSide, WorkoutPlan } from '../../../workout/types'
import type { WorkoutSource } from '../../../workout/workout-source'
import type { PlannedDays } from '../use-day-in-fragment'

// Test fixtures only: the page is checked against a fake source, never the real content.

/** `photos` is how many of the two slots hold a picture; the rest are still to be taken. */
export function exercise(key: string, name: string, cue?: string, photos: 0 | 1 | 2 = 2): Exercise {
  const picture = (slot: 1 | 2) =>
    slot > photos ? null : { src: `/pictures/${key}-${slot}.webp`, alt: `${name} — picture ${slot} of 2` }
  return { key, name, cue, pictures: [picture(1), picture(2)] }
}

export function prescription(
  of: Exercise,
  sets: number,
  reps: number | { min: number; max: number },
  per?: RepSide,
): Prescription {
  const target = typeof reps === 'number' ? { min: reps, max: reps } : reps
  return { exercise: of, sets, reps: target, per }
}

const legPress = exercise('leg-press', 'Leg press', 'Feet mid-platform')
const legCurl = exercise('seated-leg-curl', 'Seated leg curl')
const splitSquat = exercise('split-squat', 'Bulgarian split squat', 'Start light')
const kneeRaise = exercise('knee-raise', 'Knee raise')

export const threeDays: PlannedDays = [
  {
    id: 'day-1',
    name: 'Day 1 — type A',
    prescriptions: [prescription(legPress, 4, 10), prescription(legCurl, 4, 10)],
  },
  { id: 'day-2', name: 'Day 2 — type B', prescriptions: [prescription(splitSquat, 4, 10, 'leg')] },
  { id: 'day-3', name: 'Day 3 — type A', prescriptions: [prescription(kneeRaise, 3, { min: 8, max: 12 })] },
]

export function sourceOf(days: readonly PlannedDay[]): WorkoutSource {
  return { loadPlan: () => Promise.resolve({ days }) }
}

/** A source whose answer the test decides, and when. */
export function pendingSource() {
  let settle!: { resolve: (plan: WorkoutPlan) => void; reject: (reason: unknown) => void }
  const plan = new Promise<WorkoutPlan>((resolve, reject) => {
    settle = { resolve, reject }
  })
  return {
    source: { loadPlan: () => plan } satisfies WorkoutSource,
    resolve: (days: readonly PlannedDay[]) => settle.resolve({ days }),
    reject: (reason: unknown) => settle.reject(reason),
  }
}
