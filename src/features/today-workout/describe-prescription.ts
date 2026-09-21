import type { Prescription } from '../../workout/types'

/**
 * "3 sets × 8–12 reps per leg", in pieces, so the view can enlarge the two numbers:
 * `sets` and `reps` are the numbers; each `…Unit` is the words that follow one.
 */
interface PrescriptionText {
  readonly sets: string
  readonly setsUnit: string
  readonly reps: string
  readonly repsUnit: string
}

function counted(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

export function describePrescription({
  sets,
  reps,
  per,
}: Pick<Prescription, 'sets' | 'reps' | 'per'>): PrescriptionText {
  const single = reps.min === reps.max
  return {
    sets: String(sets),
    setsUnit: counted(sets, 'set'),
    reps: single ? String(reps.min) : `${reps.min}–${reps.max}`,
    repsUnit: counted(reps.max, 'rep') + (per ? ` per ${per}` : ''),
  }
}
