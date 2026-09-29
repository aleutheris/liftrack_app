import type { WorkoutSource } from '../../workout/workout-source'
import { WorkoutPager } from './WorkoutPager'
import { hasWorkouts } from './use-workout-in-fragment'
import { usePlan } from './use-plan'
import './workout.css'

/** The planned workouts, read through whichever source the app is given (ADR-260008). */
export function Workouts({ source }: { readonly source: WorkoutSource }) {
  const state = usePlan(source)
  if (state.status === 'loading') {
    return <p role="status">Loading the plan…</p>
  }
  if (state.status === 'failed') {
    return <p role="alert" className="load-error">{`Couldn't load the plan: ${state.message}`}</p>
  }
  if (!hasWorkouts(state.plan.workouts)) {
    return <p>No workouts planned yet.</p>
  }
  return <WorkoutPager workouts={state.plan.workouts} />
}
