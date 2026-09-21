import { WorkoutDays } from '../features/today-workout/WorkoutDays'
import type { WorkoutSource } from '../workout/workout-source'
import { BuildFooter } from './BuildFooter'

export function App({ source }: { readonly source: WorkoutSource }) {
  return (
    <>
      <main className="page">
        <WorkoutDays source={source} />
      </main>
      <BuildFooter />
    </>
  )
}
