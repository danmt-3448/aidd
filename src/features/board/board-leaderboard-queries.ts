'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry } from './components/board-types'

// ---------------------------------------------------------------------------
// Shared RPC row type returned by both leaderboard RPCs.
// ---------------------------------------------------------------------------

type LeaderboardRpcRow = {
  rank: number
  user_id: string
  name: string | null
  avatar_url: string | null
  score: number
}

function mapLeaderboardRow(r: LeaderboardRpcRow): LeaderboardEntry {
  return {
    rank: Number(r.rank),
    id: r.user_id,
    name: r.name ?? '',
    avatarUrl: r.avatar_url,
    score: Number(r.score),
  }
}

// ---------------------------------------------------------------------------
// getRankingLeaderboard — BOARD-3
//
// Top-10 sunners by kudos received.
// Calls `get_ranking_leaderboard()` RPC (migration 20260804020000).
// Reads receiver identity only — sender masking is irrelevant here.
// ---------------------------------------------------------------------------

export type GetRankingLeaderboardResult =
  | { data: LeaderboardEntry[] }
  | { error: string }

export async function getRankingLeaderboard(): Promise<GetRankingLeaderboardResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_ranking_leaderboard')

    if (error) {
      console.error('[getRankingLeaderboard] rpc', error.message)
      return { error: 'Không thể tải bảng xếp hạng. Vui lòng thử lại.' }
    }

    const rows = (data ?? []) as LeaderboardRpcRow[]
    return { data: rows.map(mapLeaderboardRow) }
  } catch (err) {
    console.error('[getRankingLeaderboard] unexpected', err)
    return { error: 'Không thể tải bảng xếp hạng. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// getGiftLeaderboard — BOARD-4
//
// Top-10 sunners by secret boxes opened.
// Calls `get_gift_leaderboard()` RPC (migration 20260804020000).
// ---------------------------------------------------------------------------

export type GetGiftLeaderboardResult =
  | { data: LeaderboardEntry[] }
  | { error: string }

export async function getGiftLeaderboard(): Promise<GetGiftLeaderboardResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_gift_leaderboard')

    if (error) {
      console.error('[getGiftLeaderboard] rpc', error.message)
      return { error: 'Không thể tải bảng xếp hạng quà. Vui lòng thử lại.' }
    }

    const rows = (data ?? []) as LeaderboardRpcRow[]
    return { data: rows.map(mapLeaderboardRow) }
  } catch (err) {
    console.error('[getGiftLeaderboard] unexpected', err)
    return { error: 'Không thể tải bảng xếp hạng quà. Vui lòng thử lại.' }
  }
}

// ---------------------------------------------------------------------------
// getSpotlightAggregationRpc — BOARD-5
//
// Server-side GROUP BY via `get_spotlight_aggregation(p_hashtag_id)` RPC.
// Replaces the client-side aggregation in getSpotlightAggregation.
// Reads from kudos_public (sender masking preserved inside the RPC).
// ---------------------------------------------------------------------------

const spotlightRpcSchema = z.object({
  hashtagId: z
    .string()
    .uuid({ message: 'hashtagId phải là UUID hợp lệ' })
    .nullable()
    .optional(),
})

type SpotlightRpcRow = {
  receiver_id: string
  receiver_name: string | null
  avatar_url: string | null
  kudo_count: number
}

export interface SpotlightRpcNode {
  receiverId: string
  name: string
  avatar: string | null
  kudoCount: number
}

export type GetSpotlightRpcResult =
  | { data: SpotlightRpcNode[] }
  | { error: string }

export async function getSpotlightAggregationRpc(
  input: { hashtagId?: string | null } = {},
): Promise<GetSpotlightRpcResult> {
  const parsed = spotlightRpcSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Tham số không hợp lệ.',
    }
  }

  const { hashtagId } = parsed.data

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_spotlight_aggregation', {
      p_hashtag_id: hashtagId ?? null,
    })

    if (error) {
      console.error('[getSpotlightAggregationRpc] rpc', error.message)
      return { error: 'Không thể tải spotlight. Vui lòng thử lại.' }
    }

    const rows = (data ?? []) as SpotlightRpcRow[]
    const nodes: SpotlightRpcNode[] = rows.map((r) => ({
      receiverId: r.receiver_id,
      name: r.receiver_name ?? '',
      avatar: r.avatar_url,
      kudoCount: Number(r.kudo_count),
    }))

    return { data: nodes }
  } catch (err) {
    console.error('[getSpotlightAggregationRpc] unexpected', err)
    return { error: 'Không thể tải spotlight. Vui lòng thử lại.' }
  }
}
