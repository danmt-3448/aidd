'use client'

/**
 * use-board-leaderboards.ts — BOARD-3 + BOARD-4
 *
 * Two hooks: useRankingLeaderboard (kudos received) + useGiftLeaderboard
 * (secret boxes opened). Both call server-side RPCs added in migration
 * 20260804020000. Data is stable enough for a 5-minute staleTime.
 */

import { useQuery } from '@tanstack/react-query'
import {
  getRankingLeaderboard,
  getGiftLeaderboard,
} from './board-leaderboard-queries'
import type { LeaderboardEntry } from './components/board-types'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const leaderboardKeys = {
  all: ['board', 'leaderboard'] as const,
  ranking: () => [...leaderboardKeys.all, 'ranking'] as const,
  gift: () => [...leaderboardKeys.all, 'gift'] as const,
}

// ---------------------------------------------------------------------------
// Return type (shared shape)
// ---------------------------------------------------------------------------

export interface UseLeaderboardReturn {
  entries: LeaderboardEntry[]
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useRankingLeaderboard — BOARD-3
// Top-10 sunners by kudos received.
// ---------------------------------------------------------------------------

export function useRankingLeaderboard(): UseLeaderboardReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: leaderboardKeys.ranking(),
    queryFn: async () => {
      const result = await getRankingLeaderboard()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60_000,
  })

  return {
    entries: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

// ---------------------------------------------------------------------------
// useGiftLeaderboard — BOARD-4
// Top-10 sunners by secret boxes opened.
// ---------------------------------------------------------------------------

export function useGiftLeaderboard(): UseLeaderboardReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: leaderboardKeys.gift(),
    queryFn: async () => {
      const result = await getGiftLeaderboard()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60_000,
  })

  return {
    entries: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
