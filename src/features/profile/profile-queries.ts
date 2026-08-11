'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Exported interfaces — integration contract for Track A (phase-13/15) and tests.
// ---------------------------------------------------------------------------

/**
 * Aggregated stats for a profile page.
 * `sent` is null when the viewed profile is not the calling user (privacy guard).
 * `tier` and `stars` are null when `received < 10` (spec threshold).
 * `boxesRemaining` is always a non-null number (view coalesces to 0).
 */
export interface ProfileStats {
  received: number
  sent: number | null
  hearts: number
  boxesOpened: number
  boxesRemaining: number
  tier: string | null
  stars: number | null
}

/**
 * Safe public header for a profile page.
 * Explicit allowlist — no email, no auth.uid reference.
 */
export interface ProfileHeader {
  id: string
  full_name: string | null
  avatar_url: string | null
  department_id: string | null
  title: string | null
}

/**
 * A single kudo row as served to the profile feed.
 * Same shape as BoardKudoRow so cards are reusable across board and profile.
 * `senderId` is null when the kudo was sent anonymously.
 * `receiverId` is always populated (receiver identity is public — only sender
 * is masked for anonymous kudos). Used by sent-direction cards to navigate to
 * the receiver's profile (spec GUI_006, board TC 630f42a3).
 */
export interface ProfileKudoRow {
  id: string
  senderId: string | null
  senderName: string
  senderAvatarUrl: string | null
  receiverId: string
  receiverName: string
  receiverAvatarUrl: string | null
  contentHtml: string
  createdAt: string
  heartCount: number
  likedByMe: boolean
}

export interface ProfileCursor {
  createdAt: string
  id: string
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

// .guid() (lenient 8-4-4-4-12 hex), NOT .uuid(): Zod v4's .uuid() enforces RFC
// version/variant bits and rejects DB-valid ids (e.g. seeded/non-v4 uuids) that
// Postgres accepts. Shape-check still blocks injection / 22P02.
const uuidSchema = z.string().guid({ message: 'id phải là UUID hợp lệ' })

const listProfileKudosSchema = z.object({
  profileId: uuidSchema,
  direction: z.enum(['received', 'sent']),
  cursor: z
    .object({
      // Strict ISO8601 — the value is interpolated into a PostgREST .or()
      // filter, so a loose z.string() would allow filter-injection metachars.
      createdAt: z.string().datetime({ offset: true }),
      id: uuidSchema,
    })
    .nullable()
    .optional(),
  limit: z.number().int().min(1).max(50).default(20),
})

// ---------------------------------------------------------------------------
// Tier/stars derivation
// Spec: only shown when received >= 10. Tiers are Bronze → Silver → Gold → Diamond.
// Stars (1–3) represent progress within a tier.
// Thresholds: 10=Bronze/1, 20=Bronze/2, 30=Bronze/3,
//             40=Silver/1, 60=Silver/2, 80=Silver/3,
//             100=Gold/1, 150=Gold/2, 200=Gold/3,
//             250+=Diamond/3
// ---------------------------------------------------------------------------

const TIER_TABLE: Array<{ threshold: number; tier: string; stars: number }> = [
  { threshold: 250, tier: 'Diamond', stars: 3 },
  { threshold: 200, tier: 'Gold', stars: 3 },
  { threshold: 150, tier: 'Gold', stars: 2 },
  { threshold: 100, tier: 'Gold', stars: 1 },
  { threshold: 80, tier: 'Silver', stars: 3 },
  { threshold: 60, tier: 'Silver', stars: 2 },
  { threshold: 40, tier: 'Silver', stars: 1 },
  { threshold: 30, tier: 'Bronze', stars: 3 },
  { threshold: 20, tier: 'Bronze', stars: 2 },
  { threshold: 10, tier: 'Bronze', stars: 1 },
]

function deriveTierStars(
  received: number,
): { tier: string; stars: number } | null {
  if (received < 10) return null
  for (const entry of TIER_TABLE) {
    if (received >= entry.threshold) {
      return { tier: entry.tier, stars: entry.stars }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Helper — resolve calling user id without throwing.
// ---------------------------------------------------------------------------

async function resolveUid(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ---------------------------------------------------------------------------
// getProfileStats
//
// Reads `profile_stats` view for the given profileId.
// The view is security_invoker + caller-scoped:
//   - `sent` column is NULL when profileId ≠ auth.uid() (view enforces this).
//   - `boxes_remaining` is always coalesced to 0 by the view.
// We preserve `sent=null` for non-owners and default `boxesRemaining` to 0
// as a safety net in case the view changes.
// ---------------------------------------------------------------------------

export type GetProfileStatsResult =
  | { data: ProfileStats }
  | { error: string }

export async function getProfileStats(
  profileId: string,
): Promise<GetProfileStatsResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profile_stats')
      .select(
        'user_id, received, sent, hearts_received, boxes_opened, boxes_remaining',
      )
      .eq('user_id', profileId)
      .single()

    if (error) {
      console.error('[getProfileStats] query', error.message)
      return { error: 'Không thể tải thống kê. Vui lòng thử lại.' }
    }

    type RawStats = {
      user_id: string
      received: number | null
      sent: number | null
      hearts_received: number | null
      boxes_opened: number | null
      boxes_remaining: number | null
    }

    const row = data as RawStats
    const received = row.received ?? 0
    const tierStars = deriveTierStars(received)

    const stats: ProfileStats = {
      received,
      // null for non-owners: the view's CASE returns NULL when p.id ≠ auth.uid().
      sent: row.sent,
      hearts: row.hearts_received ?? 0,
      boxesOpened: row.boxes_opened ?? 0,
      // boxesRemaining: view coalesces to 0; default here as safety net.
      boxesRemaining: row.boxes_remaining ?? 0,
      tier: tierStars?.tier ?? null,
      stars: tierStars?.stars ?? null,
    }

    return { data: stats }
  } catch (err) {
    console.error('[getProfileStats] unexpected', err)
    return { error: 'Không thể tải thống kê. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// listProfileKudos
//
// Keyset feed from `kudos_public` on (created_at DESC, id DESC).
//
// SECURITY: direction='sent' is ONLY allowed when profileId = auth.uid().
// Any attempt to read another user's sent feed is hard-denied here —
// never delegated to RLS — because kudos_public masks sender identity
// but the sent-feed of another user is still an anon-leak vector.
// ---------------------------------------------------------------------------

export type ListProfileKudosInput = {
  profileId: string
  direction: 'received' | 'sent'
  cursor?: { createdAt: string; id: string } | null
  limit?: number
}

export type ListProfileKudosResult =
  | { data: ProfileKudoRow[]; nextCursor: ProfileCursor | null }
  | { error: string }

export async function listProfileKudos(
  input: ListProfileKudosInput,
): Promise<ListProfileKudosResult> {
  const parsed = listProfileKudosSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Tham số không hợp lệ.',
    }
  }

  const { profileId, direction, cursor, limit } = parsed.data

  // HARD DENY: sent feed for non-owner.
  // Resolve uid first; unauthenticated callers can never read any sent feed.
  const uid = await resolveUid()
  if (direction === 'sent' && profileId !== uid) {
    return { error: 'Không có quyền xem danh sách đã gửi của người khác.' }
  }

  try {
    const supabase = await createClient()

    type HeartRow = { user_id: string; is_special_day: boolean }
    type RawRow = {
      id: string
      sender_id: string | null
      sender_name: string | null
      sender_avatar_url: string | null
      receiver_id: string
      receiver_name: string | null
      receiver_avatar_url: string | null
      content_html: string
      created_at: string
      hearts: HeartRow[]
    }

    // Build query: filter column depends on direction.
    const filterColumn =
      direction === 'received' ? 'receiver_id' : 'sender_id'

    let q = supabase
      .from('kudos_public')
      .select(
        `id, sender_id, sender_name, sender_avatar_url,
         receiver_id, receiver_name, receiver_avatar_url, content_html, created_at,
         hearts(user_id, is_special_day)`,
      )
      .eq(filterColumn, profileId)

    if (cursor) {
      q = q.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      )
    }

    const { data, error } = await q
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[listProfileKudos] query', error.message)
      return { error: 'Không thể tải feed. Vui lòng thử lại.' }
    }

    const rows = (data ?? []) as RawRow[]

    const mapped: ProfileKudoRow[] = rows.map((r) => {
      const hearts: HeartRow[] = Array.isArray(r.hearts) ? r.hearts : []
      return {
        id: r.id,
        senderId: r.sender_id,
        senderName: r.sender_name ?? 'Ẩn danh',
        senderAvatarUrl: r.sender_avatar_url,
        receiverId: r.receiver_id,
        receiverName: r.receiver_name ?? '',
        receiverAvatarUrl: r.receiver_avatar_url,
        contentHtml: r.content_html,
        createdAt: r.created_at,
        heartCount: hearts.length,
        likedByMe: uid ? hearts.some((h) => h.user_id === uid) : false,
      }
    })

    const lastRow = rows[rows.length - 1]
    const nextCursor: ProfileCursor | null =
      rows.length === limit && lastRow
        ? { createdAt: lastRow.created_at, id: lastRow.id }
        : null

    return { data: mapped, nextCursor }
  } catch (err) {
    console.error('[listProfileKudos] unexpected', err)
    return { error: 'Không thể tải feed. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// getProfileHeader
//
// EXPLICIT column allowlist — no SELECT *, no email, no auth identifier.
// Returns exactly the five public fields needed by the profile page header.
// ---------------------------------------------------------------------------

export type GetProfileHeaderResult =
  | { data: ProfileHeader }
  | { error: string }

export async function getProfileHeader(
  profileId: string,
): Promise<GetProfileHeaderResult> {
  try {
    const supabase = await createClient()

    // Explicit five-column allowlist. Any future column added to `profiles`
    // (including email) is automatically excluded.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, department_id, title')
      .eq('id', profileId)
      .single()

    if (error) {
      console.error('[getProfileHeader] query', error.message)
      return { error: 'Không thể tải thông tin người dùng. Vui lòng thử lại.' }
    }

    type RawHeader = {
      id: string
      full_name: string | null
      avatar_url: string | null
      department_id: string | null
      title: string | null
    }

    const row = data as RawHeader

    const header: ProfileHeader = {
      id: row.id,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      department_id: row.department_id,
      title: row.title,
    }

    return { data: header }
  } catch (err) {
    console.error('[getProfileHeader] unexpected', err)
    return {
      error: 'Không thể tải thông tin người dùng. Vui lòng thử lại.',
    }
  }
}
