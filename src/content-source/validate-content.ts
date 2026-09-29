import { isObject } from './json-checks'
import type { RawCatalogue, RawPlan } from './raw-content'
import { validateCatalogue, validateGroups, type PictureSizes } from './validate-catalogue'
import { validateWorkoutPictures } from './validate-workout-pictures'
import { validatePlan } from './validate-plan'

export interface ContentFiles {
  /** content/exercises.json, parsed. */
  readonly exercises: unknown
  /** content/exercise-groups.json, parsed — extra info about an exercise; may be absent entirely. */
  readonly groups?: unknown
  /** content/plan.json, parsed. */
  readonly plan: unknown
  /** The browser cannot read file sizes, so there each is null; CI reads them from disk. */
  readonly pictureSizes: PictureSizes
}

export interface ContentCheckOptions {
  /**
   * Whether a picture exercises.json names but content/pictures/ lacks is a problem. It is in CI, which
   * gates the deploy, so a typo is caught; the page shows that slot as missing instead (ADR-260008).
   */
  readonly picturesMustExist?: boolean
}

/** Every way the content departs from ADR-260008's format, as messages naming file and field. */
export function validateContent(
  { exercises, groups, plan, pictureSizes }: ContentFiles,
  { picturesMustExist = true }: ContentCheckOptions = {},
): string[] {
  const groupSlugs = new Set(isObject(groups) ? Object.keys(groups) : [])
  const exerciseSlugs = new Set(isObject(exercises) ? Object.keys(exercises) : [])
  const problems = [
    ...validateGroups(groups),
    ...validateCatalogue(exercises, groupSlugs, { sizes: pictureSizes, mustExist: picturesMustExist }),
    ...validatePlan(plan, exerciseSlugs),
  ]
  if (problems.length > 0) {
    return problems
  }
  // A workout's picture total is read through workout → row → exercise → file → size, so it is a fact only
  // once every one of those links holds: a row naming an unknown exercise would weigh nothing, and a
  // picture already over its own budget would be reported a second time as part of a total that
  // changes the moment it is resized. Passing both checks first is also what makes these casts safe.
  return validateWorkoutPictures(exercises as RawCatalogue, plan as RawPlan, pictureSizes)
}
