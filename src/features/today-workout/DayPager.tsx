import { type RefObject, useRef } from 'react'
import { flushSync } from 'react-dom'
import type { PlannedDay } from '../../workout/types'
import { DayView } from './DayView'
import { type PlannedDays, useDayInFragment } from './use-day-in-fragment'

/** Every planned day, one at a time in plan order, with previous/next in a bar at thumb reach. */
export function DayPager({ days }: { readonly days: PlannedDays }) {
  const { day, goTo } = useDayInFragment(days)
  const position = days.indexOf(day)
  const previous = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  return (
    <>
      <DayView key={day.id} day={day} />
      <nav className="pager" aria-label="Days">
        <div className="pager__bar">
          <PageButton ref={previous} other={next} label="Previous day" target={days[position - 1]} onGo={goTo} />
          <p className="pager__position" aria-live="polite">
            {`Day ${position + 1} of ${days.length}`}
          </p>
          <PageButton ref={next} other={previous} label="Next day" target={days[position + 1]} onGo={goTo} />
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
  /** The day this button goes to; none at either end of the plan. */
  readonly target: PlannedDay | undefined
  readonly onGo: (day: PlannedDay) => void
}

function PageButton({ ref, other, label, target, onGo }: PageButtonProps) {
  const go = (to: PlannedDay, pressed: HTMLButtonElement) => {
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
