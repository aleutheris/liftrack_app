import exercises from '../../content/exercises.json'
import plan from '../../content/plan.json'
import { createFileSource } from './file-source'

/** The plan from the repository's content/ folder, bundled at build time (ADR-260008). */
export const fileWorkoutSource = createFileSource({
  exercises,
  plan,
  // `no-inline` keeps every picture a file of its own, however small: an inlined picture would load
  // with the script whether or not it is ever scrolled to, defeating lazy loading (EPIC-260007).
  pictureModules: import.meta.glob<string>('../../content/pictures/*', {
    eager: true,
    query: '?url&no-inline',
    import: 'default',
  }),
})
