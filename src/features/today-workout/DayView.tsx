import type { PlannedDay } from '../../workout/types'
import { ExerciseCard } from './ExerciseCard'

export function DayView({ day }: { readonly day: PlannedDay }) {
  // The first exercise's pictures load at once and at high priority, so a server that prioritises
  // sends them first on a slow gym connection (EPIC-260007). The rest are lazy, but on a phone-sized
  // day the browser's lazy-load margin still starts most of them when the day opens.
  return (
    <>
      <h1 className="day-name">{day.name}</h1>
      <ol className="exercises" aria-label="Exercises">
        {day.prescriptions.map((prescription, index) => (
          <li key={`${index}-${prescription.exercise.key}`}>
            <ExerciseCard prescription={prescription} eager={index === 0} />
          </li>
        ))}
      </ol>
    </>
  )
}
