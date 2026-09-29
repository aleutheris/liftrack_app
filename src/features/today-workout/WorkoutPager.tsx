import { type RefObject, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { PlannedWorkout } from '../../workout/types'
import { WorkoutView } from './WorkoutView'
import { type PlannedWorkouts, useWorkoutInFragment } from './use-workout-in-fragment'

/** Every planned workout, one at a time in plan order, with previous/next in a bar at thumb reach. */
export function WorkoutPager({ workouts }: { readonly workouts: PlannedWorkouts }) {
  const { workout, goTo } = useWorkoutInFragment(workouts)
  const position = workouts.indexOf(workout)
  const previous = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  return (
    <>
      <WorkoutView key={workout.id} workout={workout} />
      <nav className="pager" aria-label="Workouts">
        <div className="pager__bar">
          <PageButton ref={previous} other={next} label="Previous workout" target={workouts[position - 1]} onGo={goTo} />
          <p className="pager__position" aria-live="polite">
            {`Workout ${position + 1} of ${workouts.length}`}
          </p>
          <PageButton ref={next} other={previous} label="Next workout" target={workouts[position + 1]} onGo={goTo} />
        </div>
      </nav>
    </>
  )
}

type ButtonRef = RefObject<HTMLButtonElement | null>

interface PageButtonProps {
  readonly ref: ButtonRef
  /** The pager's other button: it takes the focus when a press disables this one. */
  readonly other: ButtonRef
  readonly label: string
  /** The workout this button goes to; none at either end of the plan. */
  readonly target: PlannedWorkout | undefined
  readonly onGo: (workout: PlannedWorkout) => void
}

function PageButton({ ref, other, label, target, onGo }: PageButtonProps) {
  const go = (to: PlannedWorkout, pressed: HTMLButtonElement) => {
    const hadFocus = document.activeElement === pressed
    // Rendered at once: a press that reached either end of the plan has now disabled its button,
    // which would drop keyboard focus to the page, so the other button takes it.
    flushSync(() => onGo(to))
    if (hadFocus && pressed.disabled) other.current?.focus()
  }
  return (
    <button
      ref={ref}
      type="button"
      className="pager__button"
      disabled={!target}
      onClick={target ? (event) => go(target, event.currentTarget) : undefined}
    >
      {label}
    </button>
  )
}
