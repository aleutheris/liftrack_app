import { Workouts } from '../features/today-workout/Workouts'
import type { WorkoutSource } from '../workout/workout-source'
import { BuildFooter } from './BuildFooter'

export function App({ source }: { readonly source: WorkoutSource }) {
  return (
    <>
      <main className="page">
        <Workouts source={source} />
      </main>
      <BuildFooter />
    </>
  )
}
