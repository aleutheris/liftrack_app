import { useEffect, useState } from 'react'
import type { PlannedWorkout } from '../../workout/types'

/** The planned workouts of a plan that has at least one — the pager has nothing to show otherwise. */
export type PlannedWorkouts = readonly [PlannedWorkout, ...PlannedWorkout[]]

export function hasWorkouts(workouts: readonly PlannedWorkout[]): workouts is PlannedWorkouts {
  return workouts.length > 0
}

function idInFragment(): string {
  return window.location.hash.slice(1)
}

/**
 * The workout being viewed, kept in the URL fragment (`#workout-2`) so a reload or a restored tab stays on
 * it (ADR-260008). An empty or unknown fragment shows the first workout; a hand-edited one is followed.
 */
export function useWorkoutInFragment(workouts: PlannedWorkouts) {
  // The id, not the workout itself, so a plan that arrives again still finds the workout being viewed.
  const [id, setId] = useState(idInFragment)

  useEffect(() => {
    const follow = () => {
      setId(idInFragment())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [])

  const goTo = (target: PlannedWorkout) => {
    // Replace rather than push: paging must not fill the back button with one entry per tap.
    window.history.replaceState(null, '', `#${target.id}`)
    setId(target.id)
    window.scrollTo(0, 0)
  }

  return { workout: workouts.find((workout) => workout.id === id) ?? workouts[0], goTo }
}
