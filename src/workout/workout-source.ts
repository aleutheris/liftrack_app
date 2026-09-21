import type { WorkoutPlan } from './types'

/**
 * The one seam between the page and wherever the plan comes from (ADR-260008). The first slice
 * implements it over bundled content files; the backend adapter implements it later, and the page
 * does not change.
 */
export interface WorkoutSource {
  loadPlan(): Promise<WorkoutPlan>
}
