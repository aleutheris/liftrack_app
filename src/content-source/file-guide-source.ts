import type { SetsGuide } from '../workout/types'
import type { RawGuide } from './raw-content'
import { validateGuide } from './validate-guide'

/**
 * The sets guide, or none. A guide that fails the format is dropped, not thrown: the workouts matter
 * more in the gym than the panel, and CI fails the same problems before anything deploys (ICR-260005).
 */
export function readGuide(guide: unknown): SetsGuide | undefined {
  if (guide === undefined) {
    return undefined
  }
  const problems = validateGuide(guide)
  if (problems.length > 0) {
    console.error(`The sets guide is not shown:\n${problems.join('\n')}`)
    return undefined
  }
  return guide as RawGuide
}

// A glob, not an import, so that a content/ without guide.json builds and shows no panel.
const bundled = import.meta.glob<unknown>('../../content/guide.json', { eager: true, import: 'default' })

/** content/guide.json, bundled at build time (ADR-260008). */
export const fileGuide: SetsGuide | undefined = readGuide(Object.values(bundled)[0])
