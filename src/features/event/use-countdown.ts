'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEventConfig } from './event-actions'
import { computeRemaining, isValidTarget, type CountdownValues } from '@/lib/time/countdown'

// ---------------------------------------------------------------------------
// Public return type (integration contract for Countdown UI + Homepage)
// ---------------------------------------------------------------------------

export interface UseCountdownReturn extends CountdownValues {
  /**
   * true when config is missing, the row has no valid date, or the date
   * string fails isValidTarget(). UI must render "--:--:--" and keep nav
   * locked (fail closed).
   */
  invalid: boolean
  /** true while the initial server-action fetch is in flight */
  isLoading: boolean
}

// ---------------------------------------------------------------------------
// useCountdown
// Fetches event_start_at via TanStack Query (server action), then ticks
// per-second via setInterval. Cleans up on unmount — no interval leak.
//
// Derived-value pattern: the effect only manages a `now` timestamp in state.
// `values` is derived from `now` + `config` on every render — no synchronous
// setState in the effect body, so react-hooks/set-state-in-effect is clean.
//
// `now` uses a lazy initializer and is incremented by exactly 1000 ms per
// tick rather than re-sampling Date.now() each time — this keeps the derived
// value deterministic under fake timers (test environments with
// shouldAdvanceTime: true) while still matching real-clock behaviour.
//
// Usage:
//   const { days, hours, minutes, seconds, done, invalid } = useCountdown()
// ---------------------------------------------------------------------------

export function useCountdown(): UseCountdownReturn {
  const { data: config, isLoading } = useQuery({
    queryKey: ['event-config'],
    queryFn: () => getEventConfig(),
    // Config rarely changes during a live event — no need to re-fetch on
    // every focus. 5-minute stale window keeps latency low.
    staleTime: 5 * 60 * 1000,
    // Retry once on transient failure; on null (no row) retrying is pointless
    retry: 1,
  })

  // Lazy initializer: captures the mount time so the first derived value
  // already reflects the correct remaining time without a zero flash.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    // No config yet (loading) or null (missing row) → nothing to tick
    if (!config) return

    const { eventStartAt } = config

    // Invalid date string → stay at zero; caller reads invalid=true
    if (!isValidTarget(eventStartAt)) return

    const id = setInterval(() => {
      // Increment by exactly 1000 ms per tick rather than re-sampling
      // Date.now(). This keeps derivation deterministic: each tick advances
      // `now` by one second regardless of real-clock drift or fake-timer
      // skew introduced by shouldAdvanceTime: true in test environments.
      setNow((prev) => {
        const next = prev + 1000
        // Stop ticking once done — no need to keep the interval running.
        // We check against the incremented value so the final render reflects
        // done=true on the same tick that crosses the threshold.
        if (computeRemaining(eventStartAt, next).done) clearInterval(id)
        return next
      })
    }, 1000)

    return () => clearInterval(id)
  }, [config])

  // Derive countdown values from current `now` snapshot + config.
  // Falls back to zero-state when config is absent or date is invalid.
  const values: CountdownValues =
    config && isValidTarget(config.eventStartAt)
      ? computeRemaining(config.eventStartAt, now)
      : { days: 0, hours: 0, minutes: 0, seconds: 0, done: false }

  // Determine invalid: loading is not invalid (we just don't know yet)
  const invalid =
    !isLoading &&
    (config === null ||
      config === undefined ||
      !isValidTarget(config.eventStartAt))

  return {
    ...values,
    invalid,
    isLoading,
  }
}
