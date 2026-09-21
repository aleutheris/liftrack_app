import { useEffect, useState } from 'react'
import type { WorkoutPlan } from '../../workout/types'
import type { WorkoutSource } from '../../workout/workout-source'

type PlanState =
  | { readonly status: 'loading' }
  | { readonly status: 'failed'; readonly message: string }
  | { readonly status: 'loaded'; readonly plan: WorkoutPlan }

/**
 * Loads the plan from the source. A result that arrives after the source changed or the view
 * unmounted is dropped — StrictMode's second effect run means there is always one such result.
 */
export function usePlan(source: WorkoutSource): PlanState {
  const [state, setState] = useState<PlanState>({ status: 'loading' })

  useEffect(() => {
    let current = true
    const settle = (next: PlanState) => {
      if (current) setState(next)
    }
    source.loadPlan().then(
      (plan) => settle({ status: 'loaded', plan }),
      (error: unknown) =>
        settle({ status: 'failed', message: error instanceof Error ? error.message : String(error) }),
    )
    return () => {
      current = false
    }
  }, [source])

  return state
}
