import { Workouts } from '../features/today-workout/Workouts'
import type { SetsGuide } from '../workout/types'
import type { WorkoutSource } from '../workout/workout-source'
import { BuildFooter } from './BuildFooter'

export function App({ source, guide }: { readonly source: WorkoutSource; readonly guide?: SetsGuide }) {
  return (
    <>
      <main className="page">
        <Workouts source={source} guide={guide} />
      </main>
      <BuildFooter />
    </>
  )
}
