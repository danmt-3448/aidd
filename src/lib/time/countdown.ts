/**
 * Pure countdown utilities — no I/O, no Date.now() inside.
 * All time values are injected so callers (and tests) control the clock.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CountdownValues {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** true when remaining ≤ 0 — signals UI to unlock nav */
  done: boolean
}

// ---------------------------------------------------------------------------
// isValidTarget
// Guards the fallback path. Returns false for empty, non-ISO, or NaN dates.
// ---------------------------------------------------------------------------

export function isValidTarget(iso: string): boolean {
  if (!iso || iso.trim().length === 0) return false
  const ms = Date.parse(iso)
  return !isNaN(ms)
}

// ---------------------------------------------------------------------------
// computeRemaining
// Computes days/hours/minutes/seconds from nowMs to targetIso.
// - All values clamped to 0 (no negatives exposed to UI).
// - done=true when remaining ≤ 0.
// - Callers must guard with isValidTarget before calling; passing an invalid
//   ISO string is a programming error and will return all-zero + done=true.
// ---------------------------------------------------------------------------

export function computeRemaining(targetIso: string, nowMs: number): CountdownValues {
  const targetMs = Date.parse(targetIso)

  // Invalid ISO → fail closed: all zero, done=true
  if (isNaN(targetMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }

  const remainingMs = targetMs - nowMs

  // Past or exact-zero: done
  if (remainingMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }

  // Round UP to whole minutes. The UI shows only Days/Hours/Minutes (seconds
  // are tracked but never rendered), so a floor would display a frozen "0 phút"
  // for the entire final sub-minute while done stays false — the counter looks
  // finished up to 59s before the button appears. Ceiling makes it count
  // …3 → 2 → 1 → done, hitting done exactly at event_start_at. Trade-off: near a
  // whole-minute boundary the top digit may read one minute high (round-up).
  const totalMinutes = Math.ceil(remainingMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  // Seconds are not displayed and are meaningless at minute granularity.
  return { days, hours, minutes, seconds: 0, done: false }
}
