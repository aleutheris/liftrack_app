import { unless } from './json-checks'
import type { RawCatalogue, RawWorkout, RawPlan } from './raw-content'
import type { PictureSizes } from './validate-catalogue'

// What one workout's pictures may weigh together. Opening a workout fetches nearly all of them: measured on
// 2026-09-23, 12 of a workout's 14 pictures were fetched without scrolling, so a workout of 100 KB pictures
// settled 6.9 s after navigation start. REQ-QR-260002's 1.6 Mbps is about 200 KB/s, so 600 KB is
// about 3 s, leaving the rest of EPIC-260007's 4 s cold open for the ~74 KB of code the build ships
// today — not for the 250 KB gzip e2e/payload.spec.ts allows, which alongside this total would
// overrun 4 s: the two are separate budgets, and neither on its own holds the open to 4 s.
// Today's seven-exercise workouts have room to spare here — their 14 pictures at the 40 KB picture
// budget are 560 KB, so that budget is what binds them — and this total catches a workout that grows
// past it.
const WORKOUT_PICTURE_BYTES_MAX = 600 * 1024

/**
 * One problem per workout of content/plan.json whose pictures weigh more together than a cold open can
 * afford. Runs on content the catalogue and plan checks have passed, so every row names an exercise
 * of the catalogue; in CI every picture is also a file of content/pictures/, while on the page one
 * that is not is shown as missing and so weighs nothing.
 */
export function validateWorkoutPictures(
  catalogue: RawCatalogue,
  plan: RawPlan,
  pictureSizes: PictureSizes,
): string[] {
  return plan.workouts.flatMap((workout, index) => {
    // The location stays a path a reader can resolve to a field, as every other problem message
    // does; the workout id, which the plan check has proved is a slug, names the workout in the sentence.
    const location = `plan.json workouts[${index}]`
    const id = JSON.stringify(workout.id)
    const bytes = workoutPictureBytes(workout, catalogue, pictureSizes)
    return unless(
      bytes <= WORKOUT_PICTURE_BYTES_MAX,
      `${location}: workout ${id} needs ${bytes} bytes of pictures, over the ${WORKOUT_PICTURE_BYTES_MAX}-byte workout budget`,
    )
  })
}

/**
 * What opening the workout costs: each distinct file once, however many of the workout's exercises name it,
 * because the browser fetches one URL once. A size of null is unknown rather than zero — the browser
 * cannot read file sizes — and is left out; CI reads the real sizes from disk.
 */
function workoutPictureBytes(workout: RawWorkout, catalogue: RawCatalogue, sizes: PictureSizes): number {
  const slugs = new Set(workout.exercises.map((row) => row.exercise))
  const files = new Set(
    Object.entries(catalogue)
      .filter(([slug]) => slugs.has(slug))
      .flatMap(([, exercise]) => exercise.pictures ?? []),
  )
  return [...files].reduce((bytes, file) => bytes + (sizes.get(file) ?? 0), 0)
}
