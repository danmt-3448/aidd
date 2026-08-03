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

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, done: false }
}
