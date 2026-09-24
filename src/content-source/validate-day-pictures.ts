import { unless } from './json-checks'
import type { RawCatalogue, RawDay, RawPlan } from './raw-content'
import type { PictureSizes } from './validate-catalogue'

// What one day's pictures may weigh together. Opening a day fetches nearly all of them: measured on
// 2026-09-23, 12 of a day's 14 pictures were fetched without scrolling, so a day of 100 KB pictures
// settled 6.9 s after navigation start. REQ-QR-260002's 1.6 Mbps is about 200 KB/s, so 600 KB is
// about 3 s, leaving the rest of EPIC-260007's 4 s cold open for the ~74 KB of code the build ships
// today — not for the 250 KB gzip e2e/payload.spec.ts allows, which alongside this total would
// overrun 4 s: the two are separate budgets, and neither on its own holds the open to 4 s.
// Today's seven-exercise days have room to spare here — their 14 pictures at the 40 KB picture
// budget are 560 KB, so that budget is what binds them — and this total catches a day that grows
// past it.
const DAY_PICTURE_BYTES_MAX = 600 * 1024

/**
 * One problem per day of content/plan.json whose pictures weigh more together than a cold open can
 * afford. Runs on content the catalogue and plan checks have passed, so every row names an exercise
 * of the catalogue and every picture is a file of content/pictures/.
 */
export function validateDayPictures(
  catalogue: RawCatalogue,
  plan: RawPlan,
  pictureSizes: PictureSizes,
): string[] {
  return plan.days.flatMap((day, index) => {
    // The location stays a path a reader can resolve to a field, as every other problem message
    // does; the day id, which the plan check has proved is a slug, names the day in the sentence.
    const location = `plan.json days[${index}]`
    const id = JSON.stringify(day.id)
    const bytes = dayPictureBytes(day, catalogue, pictureSizes)
    return unless(
      bytes <= DAY_PICTURE_BYTES_MAX,
      `${location}: day ${id} needs ${bytes} bytes of pictures, over the ${DAY_PICTURE_BYTES_MAX}-byte day budget`,
    )
  })
}

/**
 * What opening the day costs: each distinct file once, however many of the day's exercises name it,
 * because the browser fetches one URL once. A size of null is unknown rather than zero — the browser
 * cannot read file sizes — and is left out; CI reads the real sizes from disk.
 */
function dayPictureBytes(day: RawDay, catalogue: RawCatalogue, sizes: PictureSizes): number {
  const slugs = new Set(day.exercises.map((row) => row.exercise))
  const files = new Set(
    Object.entries(catalogue)
      .filter(([slug]) => slugs.has(slug))
      .flatMap(([, exercise]) => exercise.pictures ?? []),
  )
  return [...files].reduce((bytes, file) => bytes + (sizes.get(file) ?? 0), 0)
}
