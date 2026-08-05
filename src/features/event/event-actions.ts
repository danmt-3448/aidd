'use server'

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Public return types (integration contract)
// ---------------------------------------------------------------------------

export interface EventConfig {
  eventStartAt: string // ISO 8601 UTC string
  heartsSpecialMultiplier: number
}

export type GetEventConfigResult = EventConfig | null

// ---------------------------------------------------------------------------
// getEventConfig
// Reads the singleton event_config row (id=1).
// Auth-guarded: Countdown route is behind the session guard.
// Returns null on missing row or auth failure — callers must treat null as
// "invalid/missing" and render --:--:-- with nav locked (fail closed).
// ---------------------------------------------------------------------------

export async function getEventConfig(): Promise<GetEventConfigResult> {
  // PUBLIC: launch time is not secret and /countdown is shown to anonymous
  // visitors (the pre-launch gate redirects everyone there). event_config is
  // anon-readable via RLS — no auth check here, or anon would see a broken
  // "chưa cấu hình" countdown.
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_config')
    .select('event_start_at, hearts_special_multiplier')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('[getEventConfig]', error.message)
    return null
  }

  if (!data) {
    // No seed row — fail closed
    return null
  }

  return {
    eventStartAt: data.event_start_at,
    heartsSpecialMultiplier: data.hearts_special_multiplier,
  }
}
