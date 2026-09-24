import { isObject } from './json-checks'
import type { RawCatalogue, RawPlan } from './raw-content'
import { validateCatalogue, type PictureSizes } from './validate-catalogue'
import { validateDayPictures } from './validate-day-pictures'
import { validatePlan } from './validate-plan'

export interface ContentFiles {
  /** content/exercises.json, parsed. */
  readonly exercises: unknown
  /** content/plan.json, parsed. */
  readonly plan: unknown
  /** The browser cannot read file sizes, so there only existence is checked; CI checks the sizes. */
  readonly pictureSizes: PictureSizes
}

/** Every way the content departs from ADR-260008's format, as messages naming file and field. */
export function validateContent({ exercises, plan, pictureSizes }: ContentFiles): string[] {
  const exerciseSlugs = new Set(isObject(exercises) ? Object.keys(exercises) : [])
  const problems = [...validateCatalogue(exercises, pictureSizes), ...validatePlan(plan, exerciseSlugs)]
  if (problems.length > 0) {
    return problems
  }
  // A day's picture total is read through day → row → exercise → file → size, so it is a fact only
  // once every one of those links holds: a row naming an unknown exercise would weigh nothing, and a
  // picture already over its own budget would be reported a second time as part of a total that
  // changes the moment it is resized. Passing both checks first is also what makes these casts safe.
  return validateDayPictures(exercises as RawCatalogue, plan as RawPlan, pictureSizes)
}
