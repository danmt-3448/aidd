'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

// .guid() accepts any 8-4-4-4-12 hex UUID (version-0 seed ids, v4 prod ids).
// .uuid() in Zod v4 enforces RFC version/variant bytes and rejects seed UUIDs
// like 'dddddddd-0000-0000-…'. Profile queries use the same pattern.
const toggleHeartSchema = z.object({
  kudoId: z.string().guid({ message: 'kudoId phải là UUID hợp lệ' }),
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
  // Codes raised by the toggle_heart RPC (20260811010000).
  if (code === 'P0008') {
    return 'Bạn không thể thả tim cho Kudo của chính mình.'
  }
  if (code === 'P0007') {
    return 'Kudo không tồn tại.'
  }
  if (code === 'P0001') {
    return 'Bạn cần đăng nhập để thả tim.'
  }
  // Backstop: RLS WITH CHECK on hearts_insert_own (42501 / "new row violates")
  // and FK violation (23503) still map cleanly if the RPC is bypassed.
  if (code === '42501' || msg.toLowerCase().includes('new row violates')) {
    return 'Bạn không thể thả tim cho Kudo của chính mình.'
  }
  if (code === '23503') {
    return 'Kudo không tồn tại.'
  }
  return 'Không thể thực hiện. Vui lòng thử lại.'
}

// ---------------------------------------------------------------------------
// toggleHeart
//
// Delegates the whole like/unlike to the `toggle_heart` RPC (20260811010000):
// one atomic transaction that toggles the heart, stamps special-day at insert,
// enforces the self-heart guard, and returns the authoritative count. This
// replaces the former SELECT-then-INSERT/DELETE path, which raced on a rapid
// double-click (concurrent inserts → PK 23505). The RPC uses ON CONFLICT DO
// NOTHING so a concurrent like resolves idempotently instead of erroring.
// ---------------------------------------------------------------------------

export async function toggleHeart(kudoId: string): Promise<ToggleHeartResult> {
  // 1. Validate input
  const parsed = toggleHeartSchema.safeParse({ kudoId })
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'kudoId không hợp lệ.',
    }
  }

  // 2. Auth guard (RPC also guards via P0001; this returns the friendly copy early)
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Bạn cần đăng nhập để thả tim.' }
  }

  // 3. Atomic toggle in one round-trip.
  const { data, error } = await supabase
    .rpc('toggle_heart', { p_kudo_id: kudoId })
    .single<{ liked: boolean; heart_count: number }>()

  if (error) {
    console.error('[toggleHeart] rpc', error.code, error.message)
    return { error: friendlyHeartError(error.code ?? '', error.message) }
  }

  return { data: { liked: data.liked, heartCount: data.heart_count } }
}
