import type { PlannedWorkout } from '../../workout/types'
import { ExerciseCard } from './ExerciseCard'

export function WorkoutView({ workout }: { readonly workout: PlannedWorkout }) {
  // The first exercise's pictures load at once and at high priority, so a server that prioritises
  // sends them first on a slow gym connection (EPIC-260007). The rest are lazy, but on a phone-sized
  // workout the browser's lazy-load margin still starts most of them when the workout opens.
  return (
    <>
      <h1 className="workout-name">{workout.name}</h1>
      <ol className="exercises" aria-label="Exercises">
        {workout.prescriptions.map((prescription, index) => (
          <li key={`${index}-${prescription.exercise.key}`}>
            <ExerciseCard prescription={prescription} eager={index === 0} />
          </li>
        ))}
      </ol>
    </>
  )
}
