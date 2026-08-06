'use client'

/**
 * ui-state-override.ts — dev-only ?ui_state= toggle for UI-First Gate.
 *
 * Reads the `?ui_state` query param (client-side, via useSearchParams).
 * ONLY active when process.env.NODE_ENV !== 'production'.
 * Returns null in production or when the param is absent/invalid.
 *
 * Valid values: 'full' | 'empty' | 'error' | 'loading'
 *
 * Hoisted from src/features/board/use-ui-state-override.ts so every
 * feature can reuse the same hook (DRY — phase-02 infra).
 */

import { useSearchParams } from 'next/navigation'

export type UiStateOverride = 'full' | 'empty' | 'error' | 'loading'

const VALID_STATES = new Set<string>(['full', 'empty', 'error', 'loading'])

export function useUiStateOverride(): UiStateOverride | null {
  const searchParams = useSearchParams()

  // Guard: no-op in production — never leak mock data into prod.
  if (process.env.NODE_ENV === 'production') return null

  const raw = searchParams.get('ui_state')
  if (raw === null) return null
  if (VALID_STATES.has(raw)) return raw as UiStateOverride

  return null
}
