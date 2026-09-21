import { isObject } from './json-checks'
import { validateCatalogue, type PictureSizes } from './validate-catalogue'
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
  return [...validateCatalogue(exercises, pictureSizes), ...validatePlan(plan, exerciseSlugs)]
}
