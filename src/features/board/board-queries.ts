'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Exported interfaces — integration contract for Track A (phase-12) and tests.
// ---------------------------------------------------------------------------

/**
 * A single kudo row as served to the Live board feed.
 * `senderId` is null when the kudo was sent anonymously (mask applied by
 * `kudos_public` view — never fetched from the base `kudos` table directly).
 */
export interface BoardKudoRow {
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

/**
 * Aggregated recipient node for the spotlight word-cloud.
 * Layout math lives in Track A / integration phase — this query returns the
 * flat counts only.
 */
export interface SpotlightNode {
  receiverId: string
  name: string
  avatar: string | null
  kudoCount: number
}

// ---------------------------------------------------------------------------
// Keyset cursor — composite (createdAt, id) for stable pagination.
// ---------------------------------------------------------------------------

export interface BoardCursor {
  createdAt: string
  id: string
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid({ message: 'id phải là UUID hợp lệ' })

const listBoardKudosSchema = z.object({
  cursor: z
    .object({
      // Strict ISO8601 — rejects malformed values before they reach PostgREST.
      createdAt: z.string().datetime({ message: 'cursor.createdAt phải là ISO8601 hợp lệ' }),
      id: uuidSchema,
    })
    .nullable()
    .optional(),
  hashtagId: uuidSchema.nullable().optional(),
  limit: z.number().int().min(1).max(50).default(20),
})

const spotlightSchema = z.object({
  hashtagId: uuidSchema.nullable().optional(),
})

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
// getHighlightKudos
// Fetches the top-5 kudos ranked by weighted heart count.
//
// Weighted score = count(hearts) + (count of special-day hearts) * (multiplier - 1)
// The multiplier comes from today's row in `special_day_config`; on non-special
// days the multiplier is 1, so the weight term is zero and ordering is by raw count.
//
// All reads are FROM `kudos_public` — never the base `kudos` table.
// ---------------------------------------------------------------------------

export type HighlightKudosResult =
  | { data: BoardKudoRow[] }
  | { error: string }

export async function getHighlightKudos(): Promise<HighlightKudosResult> {
  try {
    const supabase = await createClient()

    // Fetch today's multiplier (may return 0 rows on non-special days → default 1).
    const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
    const { data: sdRow, error: sdErr } = await supabase
      .from('special_day_config')
      .select('hearts_multiplier')
      .eq('event_date', today)
      .maybeSingle()

    if (sdErr) {
      console.error('[getHighlightKudos] special_day_config fetch', sdErr.message)
      return { error: 'Không thể tải dữ liệu. Vui lòng thử lại.' }
    }

    const multiplier = sdRow?.hearts_multiplier ?? 1

    // Server-side weighted ranking via RPC — returns only 5 rows.
    // Replaces the former 2000-row select + JS sort.
    // The RPC applies the same anonymous-sender mask as kudos_public and
    // computes liked_by_me using auth.uid() inside the security-definer function.
    type RpcRow = {
      id: string
      receiver_id: string | null
      content_html: string
      created_at: string
      is_anonymous: boolean
      sender_id: string | null
      sender_name: string | null
      sender_avatar_url: string | null
      receiver_name: string | null
      receiver_avatar_url: string | null
      heart_count: number
      weighted_score: number
      liked_by_me: boolean
    }

    const { data: rows, error } = await supabase.rpc('get_highlight_kudos', {
      p_today: today,
      p_multiplier: multiplier,
    })

    if (error) {
      console.error('[getHighlightKudos] rpc', error.message)
      return { error: 'Không thể tải nổi bật. Vui lòng thử lại.' }
    }

    const top5: BoardKudoRow[] = ((rows ?? []) as RpcRow[]).map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      senderName: r.sender_name ?? 'Ẩn danh',
      senderAvatarUrl: r.sender_avatar_url,
      receiverId: r.receiver_id ?? '',
      receiverName: r.receiver_name ?? '',
      receiverAvatarUrl: r.receiver_avatar_url,
      contentHtml: r.content_html,
      createdAt: r.created_at,
      heartCount: Number(r.heart_count),
      likedByMe: r.liked_by_me,
    }))

    return { data: top5 }
  } catch (err) {
    console.error('[getHighlightKudos] unexpected', err)
    return { error: 'Không thể tải nổi bật. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// listBoardKudos
// Infinite feed with keyset pagination on (created_at desc, id desc).
//
// Cursor = composite (createdAt, id) of the last fetched row. On first load,
// cursor is null/undefined and no WHERE clause is added. Subsequent pages pass
// the cursor values and the query adds:
//   WHERE (created_at, id) < (cursor.createdAt, cursor.id)
//
// Hashtag filter joins FROM kudos_public → kudo_hashtags; the mask on
// sender identity is always preserved.
// ---------------------------------------------------------------------------

export type ListBoardKudosInput = z.input<typeof listBoardKudosSchema>

export type ListBoardKudosResult =
  | { data: BoardKudoRow[]; nextCursor: BoardCursor | null }
  | { error: string }

export async function listBoardKudos(
  input: ListBoardKudosInput = {},
): Promise<ListBoardKudosResult> {
  const parsed = listBoardKudosSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Tham số không hợp lệ.',
    }
  }

  const { cursor, hashtagId, limit } = parsed.data
  const uid = await resolveUid()

  try {
    const supabase = await createClient()

    // Static select strings per branch — the Supabase TypeScript parser
    // cannot type-check a dynamic ternary string, so we use two explicit
    // query paths. Both read FROM kudos_public (mask always applied).
    //
    // Hashtag filter: `!inner` on kudo_hashtags acts as INNER JOIN, so only
    // kudos with the requested hashtag survive.
    //
    // Keyset cursor decomposition (tuple comparison not in JS builder):
    //   (created_at < cursor.createdAt)
    //   OR (created_at = cursor.createdAt AND id < cursor.id)

    type HeartRow = { user_id: string; is_special_day: boolean }
    type RawRow = {
      id: string
      sender_id: string | null
      sender_name: string | null
      sender_avatar_url: string | null
      receiver_id: string | null
      receiver_name: string | null
      receiver_avatar_url: string | null
      content_html: string
      created_at: string
      hearts: HeartRow[]
      kudo_hashtags?: unknown
    }

    let data: RawRow[] | null = null
    let error: { message: string } | null = null

    if (hashtagId) {
      let q = supabase
        .from('kudos_public')
        .select(
          `id, sender_id, sender_name, sender_avatar_url,
           receiver_id, receiver_name, receiver_avatar_url, content_html, created_at,
           hearts(user_id, is_special_day),
           kudo_hashtags!inner(hashtag_id)`,
        )
        .eq('kudo_hashtags.hashtag_id', hashtagId)

      if (cursor) {
        q = q.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        )
      }

      const res = await q
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)

      data = res.data as RawRow[] | null
      error = res.error
    } else {
      let q = supabase
        .from('kudos_public')
        .select(
          `id, sender_id, sender_name, sender_avatar_url,
           receiver_id, receiver_name, receiver_avatar_url, content_html, created_at,
           hearts(user_id, is_special_day)`,
        )

      if (cursor) {
        q = q.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        )
      }

      const res = await q
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)

      data = res.data as RawRow[] | null
      error = res.error
    }

    if (error) {
      console.error('[listBoardKudos] query', error.message)
      return { error: 'Không thể tải feed. Vui lòng thử lại.' }
    }

    const rows = data ?? []

    const mapped: BoardKudoRow[] = rows.map((r) => {
      const hearts: HeartRow[] = Array.isArray(r.hearts) ? r.hearts : []
      return {
        id: r.id,
        senderId: r.sender_id,
        senderName: r.sender_name ?? 'Ẩn danh',
        senderAvatarUrl: r.sender_avatar_url,
        receiverId: r.receiver_id ?? '',
        receiverName: r.receiver_name ?? '',
        receiverAvatarUrl: r.receiver_avatar_url,
        contentHtml: r.content_html,
        createdAt: r.created_at,
        heartCount: hearts.length,
        likedByMe: uid
          ? hearts.some((h) => h.user_id === uid)
          : false,
      }
    })

    const lastRow = rows[rows.length - 1]
    const nextCursor: BoardCursor | null =
      rows.length === limit && lastRow
        ? { createdAt: lastRow.created_at, id: lastRow.id }
        : null

    return { data: mapped, nextCursor }
  } catch (err) {
    console.error('[listBoardKudos] unexpected', err)
    return { error: 'Không thể tải feed. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// getSpotlightAggregation
// Flat recipient aggregation for the spotlight word-cloud (client-side layout).
// Reads FROM kudos_public with optional hashtag join.
// ---------------------------------------------------------------------------

export type SpotlightInput = z.input<typeof spotlightSchema>
export type SpotlightResult =
  | { data: SpotlightNode[] }
  | { error: string }

export async function getSpotlightAggregation(
  input: SpotlightInput = {},
): Promise<SpotlightResult> {
  const parsed = spotlightSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Tham số không hợp lệ.',
    }
  }

  const { hashtagId } = parsed.data

  try {
    const supabase = await createClient()

    // Static select strings per branch — same reasoning as listBoardKudos.
    type RawRow = {
      receiver_id: string | null
      receiver_name: string | null
      receiver_avatar_url: string | null
    }

    let data: RawRow[] | null = null
    let error: { message: string } | null = null

    if (hashtagId) {
      const res = await supabase
        .from('kudos_public')
        .select(
          `receiver_id, receiver_name, receiver_avatar_url,
           kudo_hashtags!inner(hashtag_id)`,
        )
        .eq('kudo_hashtags.hashtag_id', hashtagId)
        // TODO(perf): replace with GROUP BY RPC for event scale
        .limit(1000)

      data = res.data as RawRow[] | null
      error = res.error
    } else {
      const res = await supabase
        .from('kudos_public')
        .select(`receiver_id, receiver_name, receiver_avatar_url`)
        // TODO(perf): replace with GROUP BY RPC for event scale
        .limit(1000)

      data = res.data as RawRow[] | null
      error = res.error
    }

    if (error) {
      console.error('[getSpotlightAggregation] query', error.message)
      return { error: 'Không thể tải spotlight. Vui lòng thử lại.' }
    }

    const rows = data ?? []

    // Aggregate by receiver_id client-side (avoids RPC for a simple count).
    const byReceiver = new Map<
      string,
      { name: string; avatar: string | null; count: number }
    >()

    for (const r of rows) {
      if (!r.receiver_id) continue
      const existing = byReceiver.get(r.receiver_id)
      if (existing) {
        existing.count += 1
      } else {
        byReceiver.set(r.receiver_id, {
          name: r.receiver_name ?? '',
          avatar: r.receiver_avatar_url,
          count: 1,
        })
      }
    }

    const nodes: SpotlightNode[] = Array.from(byReceiver.entries()).map(
      ([receiverId, v]) => ({
        receiverId,
        name: v.name,
        avatar: v.avatar,
        kudoCount: v.count,
      }),
    )

    // Sort descending by kudoCount for predictable rendering order.
    nodes.sort((a, b) => b.kudoCount - a.kudoCount)

    return { data: nodes }
  } catch (err) {
    console.error('[getSpotlightAggregation] unexpected', err)
    return { error: 'Không thể tải spotlight. Vui lòng thử lại.' }
  }
}
