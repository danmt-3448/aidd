'use server'

/**
 * user-hover-card-actions.ts — server action for the board hover card popup.
 *
 * Returns profile data needed to render UserHoverCard for any profile on the board:
 *   - department name (short code, e.g. "CEVC10")
 *   - tier (1–4) by distinct-sender count
 *   - kudosReceived / kudosSent — REAL counts for ANY viewer via
 *     get_profile_kudo_counts() SECURITY DEFINER RPC (bypass RLS on sent).
 *
 * Tier computation: reuses the kudo_tier() SQL function added in migration
 * 20260811050000_feed_tier_department.sql via get_profile_tier RPC.
 *
 * Department limitation: only the short name is stored (departments.name).
 * Full org-path is not in the DB — callers receive the short code.
 *
 * Sent-count privacy note: sent count includes anonymous sends; user accepted
 * this (spec §3 Decisions 2026-08-11, overrides SEC_001).
 */

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod guard — rejects malformed UUID before hitting the DB.
// z.string().guid() accepts RFC v4 AND the seed-style UUIDs used in dev.
// ---------------------------------------------------------------------------

const uuidSchema = z.string().guid({ message: 'profileId phải là UUID hợp lệ' })

const getUserHoverCardSchema = z.object({
  profileId: uuidSchema,
})

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UserHoverCardData {
  /** Short department name, e.g. "CEVC10". Null when no department assigned. */
  department: string | null
  /**
   * Tier level 1–4 by distinct-sender count, or null when 0 senders.
   * 1=New Hero · 2=Rising Hero · 3=Super Hero · 4=Legend Hero
   */
  tier: 1 | 2 | 3 | 4 | null
  /** Total kudos this profile has RECEIVED (all time). */
  kudosReceived: number
  /** Total kudos this profile has SENT (all time). */
  kudosSent: number
}

export type GetUserHoverCardResult =
  | { data: UserHoverCardData }
  | { error: string }

// ---------------------------------------------------------------------------
// getUserHoverCardData
// ---------------------------------------------------------------------------

export async function getUserHoverCardData(
  profileId: unknown,
): Promise<GetUserHoverCardResult> {
  // 1. Validate input.
  const parsed = getUserHoverCardSchema.safeParse({ profileId })
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Tham số không hợp lệ.',
    }
  }

  const { profileId: id } = parsed.data

  try {
    const supabase = await createClient()

    // 2. Fetch profile + department in one join.
    //    profiles.department_ref → departments.name
    type ProfileRow = {
      department_ref: string | null
      departments: { name: string } | null
    }

    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select('department_ref, departments(name)')
      .eq('id', id)
      .maybeSingle()

    if (profileErr) {
      console.error('[getUserHoverCardData] profile fetch', profileErr.message)
      return { error: 'Không thể tải thông tin người dùng. Vui lòng thử lại.' }
    }

    const department =
      (profileRow as ProfileRow | null)?.departments?.name ?? null

    // 3. Fetch real kudos counts for ANY viewer via SECURITY DEFINER RPC.
    //    get_profile_kudo_counts() bypasses the RLS on profile_stats.sent,
    //    so third-party viewers see the actual sent count (user decision 2026-08-11).
    type CountsRow = { received: number; sent: number }

    const { data: countsRow, error: countsErr } = await supabase
      .rpc('get_profile_kudo_counts', { p_profile_id: id })
      .single()

    if (countsErr) {
      console.error('[getUserHoverCardData] get_profile_kudo_counts', countsErr.message)
      return { error: 'Không thể tải thống kê. Vui lòng thử lại.' }
    }

    const kudosReceived = Number((countsRow as CountsRow | null)?.received ?? 0)
    const kudosSent     = Number((countsRow as CountsRow | null)?.sent     ?? 0)

    // 4. Compute tier via SQL helper — one lightweight RPC call.
    //    select public.kudo_tier(count(distinct sender_id)::int from kudos where receiver_id=id)
    //    Expressed as a scalar subquery so it's a single round-trip.
    const { data: tierRow, error: tierErr } = await supabase.rpc(
      'get_profile_tier',
      { p_profile_id: id },
    )

    if (tierErr) {
      // Non-fatal: fall back to null tier rather than failing the whole card.
      console.error('[getUserHoverCardData] get_profile_tier', tierErr.message)
    }

    // get_profile_tier returns a smallint (1-4) or null.
    const rawTier = tierErr ? null : (tierRow as number | null)
    const tier: 1 | 2 | 3 | 4 | null =
      rawTier === 1 || rawTier === 2 || rawTier === 3 || rawTier === 4
        ? rawTier
        : null

    return {
      data: {
        department,
        tier,
        kudosReceived,
        kudosSent,
      },
    }
  } catch (err) {
    console.error('[getUserHoverCardData] unexpected', err)
    return { error: 'Không thể tải thông tin. Vui lòng thử lại.' }
  }
}
