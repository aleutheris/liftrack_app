import type { Exercise, Prescription } from '../../workout/types'
import { describePrescription } from './describe-prescription'

interface ExerciseCardProps {
  readonly prescription: Prescription
  /** Load the pictures at once and ahead of the others — for the day's first exercise. */
  readonly eager: boolean
}

export function ExerciseCard({ prescription, eager }: ExerciseCardProps) {
  const { exercise } = prescription
  return (
    <article className="exercise">
      <h2 className="exercise__name">{exercise.name}</h2>
      <PrescriptionLine prescription={prescription} />
      {exercise.cue && (
        <p className="exercise__cue" data-testid="cue">
          {exercise.cue}
        </p>
      )}
      <Pictures exercise={exercise} eager={eager} />
    </article>
  )
}

function PrescriptionLine({ prescription }: { readonly prescription: Prescription }) {
  const text = describePrescription(prescription)
  return (
    <p className="prescription" data-testid="prescription">
      <span className="prescription__number" data-testid="sets">
        {text.sets}
      </span>
      {` ${text.setsUnit} × `}
      <span className="prescription__number" data-testid="reps">
        {text.reps}
      </span>
      {` ${text.repsUnit}`}
    </p>
  )
}

function Pictures({ exercise, eager }: { readonly exercise: Exercise; readonly eager: boolean }) {
  return (
    <div className="exercise__pictures">
      {exercise.pictures.map((picture, index) =>
        picture === null ? (
          // Said plainly and kept in the layout: the day is usable, and the gap is visible at a
          // glance rather than looking like a picture that failed to load.
          <p className="exercise__missing" key={index} data-testid="missing-picture">
            Photo {index + 1} missing
          </p>
        ) : (
          // A square reserves the frame's own space before the picture arrives, so nothing jumps.
          <img
            key={index}
            src={picture.src}
            alt={picture.alt}
            width={400}
            height={400}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
          />
        ),
      )}
    </div>
  )
}
