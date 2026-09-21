import { useEffect, useState } from 'react'
import type { PlannedDay } from '../../workout/types'

/** The planned days of a plan that has at least one — the pager has nothing to show otherwise. */
export type PlannedDays = readonly [PlannedDay, ...PlannedDay[]]

export function hasDays(days: readonly PlannedDay[]): days is PlannedDays {
  return days.length > 0
}

function idInFragment(): string {
  return window.location.hash.slice(1)
}

/**
 * The day being viewed, kept in the URL fragment (`#day-2`) so a reload or a restored tab stays on
 * it (ADR-260008). An empty or unknown fragment shows the first day; a hand-edited one is followed.
 */
export function useDayInFragment(days: PlannedDays) {
  // The id, not the day itself, so a plan that arrives again still finds the day being viewed.
  const [id, setId] = useState(idInFragment)

  useEffect(() => {
    const follow = () => {
      setId(idInFragment())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [])

  const goTo = (target: PlannedDay) => {
    // Replace rather than push: paging must not fill the back button with one entry per tap.
    window.history.replaceState(null, '', `#${target.id}`)
    setId(target.id)
    window.scrollTo(0, 0)
  }

  return { day: days.find((day) => day.id === id) ?? days[0], goTo }
}
