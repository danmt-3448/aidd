'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const toggleHeartSchema = z.object({
  kudoId: z.string().uuid({ message: 'kudoId phải là UUID hợp lệ' }),
})

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type ToggleHeartSuccess = { liked: boolean; heartCount: number }
export type ToggleHeartResult =
  | { data: ToggleHeartSuccess }
  | { error: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map Postgres/Supabase error codes to user-friendly messages.
 * Raw error strings never reach the client.
 */
function friendlyHeartError(code: string, msg: string): string {
  // RLS WITH CHECK violation: anon sender trying to heart own kudo.
  // Supabase surfaces RLS violations as PGRST116 (no rows) or 42501 (privilege).
  if (code === '42501' || msg.toLowerCase().includes('new row violates')) {
    return 'Bạn không thể thả tim cho Kudo của chính mình.'
  }
  if (code === '23503') {
    return 'Kudo không tồn tại.'
  }
  return 'Không thể thực hiện. Vui lòng thử lại.'
}

/**
 * Fetch the current heart count for a kudo from the `hearts` table.
 * This is a single aggregate query; calling it after the toggle gives the
 * authoritative server count.
 */
async function fetchHeartCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kudoId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('hearts')
    .select('*', { count: 'exact', head: true })
    .eq('kudo_id', kudoId)

  if (error) {
    console.error('[fetchHeartCount]', error.message)
    return 0
  }
  return count ?? 0
}

// ---------------------------------------------------------------------------
// toggleHeart
//
// Inserts a heart if the caller has not yet liked this kudo, or deletes their
// existing heart if they have. The operation is idempotent at the (user, kudo)
// PK level: a double-like resolves to unliked, a double-unlike is a no-op.
//
// Self-heart guard: the phase-01 RLS `WITH CHECK` on `hearts_insert_own`
// prevents a sender from hearting their own kudo. This action catches that
// rejection and surfaces a friendly message — it does NOT re-implement the
// guard with a client-side check.
//
// Special-day stamp: `is_special_day` is set to true when today's date has a
// row in `special_day_config`; the ranking query uses this to apply the
// hearts_multiplier when computing weighted highlight scores.
// ---------------------------------------------------------------------------

export async function toggleHeart(kudoId: string): Promise<ToggleHeartResult> {
  // 1. Validate input
  const parsed = toggleHeartSchema.safeParse({ kudoId })
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'kudoId không hợp lệ.',
    }
  }

  // 2. Auth guard
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Bạn cần đăng nhập để thả tim.' }
  }

  const uid = user.id

  try {
    // 3. Check if caller already liked this kudo.
    const { data: existing, error: selectErr } = await supabase
      .from('hearts')
      .select('user_id')
      .eq('user_id', uid)
      .eq('kudo_id', kudoId)
      .maybeSingle()

    if (selectErr) {
      console.error('[toggleHeart] select existing', selectErr.message)
      return { error: 'Không thể kiểm tra trạng thái tim. Vui lòng thử lại.' }
    }

    if (existing) {
      // 4a. Already liked → delete (unlike).
      const { error: deleteErr } = await supabase
        .from('hearts')
        .delete()
        .eq('user_id', uid)
        .eq('kudo_id', kudoId)

      if (deleteErr) {
        console.error('[toggleHeart] delete', deleteErr.message)
        return { error: 'Không thể bỏ tim. Vui lòng thử lại.' }
      }

      const heartCount = await fetchHeartCount(supabase, kudoId)
      return { data: { liked: false, heartCount } }
    }

    // 4b. Not yet liked → insert with special-day stamp.
    // Resolve today's special-day config (null if not a special day → is_special_day = false).
    const today = new Date().toISOString().slice(0, 10)
    const { data: sdRow, error: sdErr } = await supabase
      .from('special_day_config')
      .select('hearts_multiplier')
      .eq('event_date', today)
      .maybeSingle()

    if (sdErr) {
      // Non-fatal: log and proceed without special-day stamp.
      console.warn('[toggleHeart] special_day_config fetch', sdErr.message)
    }

    const isSpecialDay = sdRow !== null

    const { error: insertErr } = await supabase.from('hearts').insert({
      user_id: uid,
      kudo_id: kudoId,
      is_special_day: isSpecialDay,
    })

    if (insertErr) {
      console.error('[toggleHeart] insert', insertErr.code, insertErr.message)
      return {
        error: friendlyHeartError(insertErr.code ?? '', insertErr.message),
      }
    }

    const heartCount = await fetchHeartCount(supabase, kudoId)
    return { data: { liked: true, heartCount } }
  } catch (err) {
    console.error('[toggleHeart] unexpected', err)
    return { error: 'Không thể thực hiện. Vui lòng thử lại.' }
  }
}
