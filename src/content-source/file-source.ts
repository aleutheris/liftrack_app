import type { WorkoutPlan } from '../workout/types'
import type { WorkoutSource } from '../workout/workout-source'
import { decodePlan } from './decode-plan'
import type { RawCatalogue, RawPlan } from './raw-content'
import { validateContent } from './validate-content'

/** The content as the build bundles it. */
interface BundledContent {
  readonly exercises: unknown
  readonly plan: unknown
  /** `import.meta.glob` over content/pictures/: module path → the URL the build serves it at. */
  readonly pictureModules: Readonly<Record<string, string>>
}

export function createFileSource(content: BundledContent): WorkoutSource {
  return { loadPlan: async () => readPlan(content) }
}

function readPlan({ exercises, plan, pictureModules }: BundledContent): WorkoutPlan {
  const urls = new Map(
    Object.entries(pictureModules).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url]),
  )
  // Sizes are unknown here; the CI content check (real-content.node.test.ts) reads them from disk.
  const pictureSizes = new Map([...urls.keys()].map((fileName) => [fileName, null]))
  const problems = validateContent({ exercises, plan, pictureSizes })
  if (problems.length > 0) {
    throw new Error(`The content has ${problems.length} problem(s):\n${problems.join('\n')}`)
  }
  // validateContent has checked that every picture named is one of these files.
  return decodePlan(exercises as RawCatalogue, plan as RawPlan, (fileName) => urls.get(fileName)!)
}
