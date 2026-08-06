/**
 * Mock fixtures for the /countdown screen UI-First Gate.
 *
 * Convention (ui-first-gate.md):
 *   - Each state is a plain CountdownValue object consumed by CountdownDisplay.
 *   - `mockFull` replicates the Figma design state: counting, 00 DAYS · 05 HOURS · 20 MINUTES.
 *   - `mockDone` covers the "Sự kiện đã bắt đầu!" done state.
 *   - `mockLoading` covers the loading shell (no display block shown).
 *
 * Used only in NODE_ENV !== 'production' via ?ui_state= query param.
 */

import type { UseCountdownReturn } from '@/features/event/use-countdown'

/** Counting state — matches Figma digits 00 DAYS · 05 HOURS · 20 MINUTES. */
export const mockFull: UseCountdownReturn = {
  days: 0,
  hours: 5,
  minutes: 20,
  seconds: 0,
  done: false,
  invalid: false,
  isLoading: false,
}

/** Done state — "Sự kiện đã bắt đầu!" */
export const mockDone: UseCountdownReturn = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  done: true,
  invalid: false,
  isLoading: false,
}

/** Loading state — background shell without counter (avoids zero flash). */
export const mockLoading: UseCountdownReturn = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  done: false,
  invalid: false,
  isLoading: true,
}
