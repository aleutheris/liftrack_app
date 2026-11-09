import type { PlannedWorkout, SetsGuide } from '../../workout/types'
import { ExerciseCard } from './ExerciseCard'
import { SetsGuidePanel } from './SetsGuidePanel'

export function WorkoutView({ workout, guide }: { readonly workout: PlannedWorkout; readonly guide?: SetsGuide }) {
  // The first exercise's pictures load at once and at high priority, so a server that prioritises
  // sends them first on a slow gym connection (EPIC-260007). The rest are lazy, but on a phone-sized
  // workout the browser's lazy-load margin still starts most of them when the workout opens.
  return (
    <>
      <h1 className="workout-name">{workout.name}</h1>
      {guide && <SetsGuidePanel guide={guide} />}
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
