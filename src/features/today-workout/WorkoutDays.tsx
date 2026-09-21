import type { WorkoutSource } from '../../workout/workout-source'
import { DayPager } from './DayPager'
import { hasDays } from './use-day-in-fragment'
import { usePlan } from './use-plan'
import './workout.css'

/** The planned workout days, read through whichever source the app is given (ADR-260008). */
export function WorkoutDays({ source }: { readonly source: WorkoutSource }) {
  const state = usePlan(source)
  if (state.status === 'loading') {
    return <p role="status">Loading the plan…</p>
  }
  if (state.status === 'failed') {
    return <p role="alert" className="load-error">{`Couldn't load the plan: ${state.message}`}</p>
  }
  if (!hasDays(state.plan.days)) {
    return <p>No days planned yet.</p>
  }
  return <DayPager days={state.plan.days} />
}
