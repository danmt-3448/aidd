'use client'

/**
 * use-board-user-stats.ts — BOARD-2
 *
 * Wraps getProfileStats to supply BoardUserStats for the calling user.
 * Maps: kudosReceived←received, kudosSent←sent??0, heartsReceived←hearts,
 *       secretBoxCount←boxesRemaining (unopened = the "Mở quà" button count).
 *
 * Only called when uid is non-null (authenticated). Returns safe zeros
 * until the query resolves.
 */

import { useQuery } from '@tanstack/react-query'
import { getProfileStats } from '@/features/profile/profile-queries'
import type { BoardUserStats } from './components/board-types'

// ---------------------------------------------------------------------------
// Query key factory — colocated for consistent invalidation.
// ---------------------------------------------------------------------------

export const boardUserStatsKeys = {
  all: ['board', 'userStats'] as const,
  byUid: (uid: string) => [...boardUserStatsKeys.all, uid] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseBoardUserStatsReturn {
  stats: BoardUserStats
  isLoading: boolean
  error: string | null
}

const ZERO_STATS: BoardUserStats = {
  kudosReceived: 0,
  kudosSent: 0,
  heartsReceived: 0,
  secretBoxCount: 0,
}

// ---------------------------------------------------------------------------
// useBoardUserStats
//
// uid: the currently authenticated user's id. Pass null to skip the query
// (board page is accessible while unauthenticated — sidebar shows zeros).
// ---------------------------------------------------------------------------

export function useBoardUserStats(uid: string | null): UseBoardUserStatsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: uid ? boardUserStatsKeys.byUid(uid) : boardUserStatsKeys.all,
    queryFn: async () => {
      if (!uid) return ZERO_STATS
      const result = await getProfileStats(uid)
      if ('error' in result) throw new Error(result.error)

      const stats: BoardUserStats = {
        kudosReceived: result.data.received,
        kudosSent: result.data.sent ?? 0,
        heartsReceived: result.data.hearts,
        secretBoxCount: result.data.boxesRemaining,
      }
      return stats
    },
    enabled: !!uid,
    staleTime: 60_000,
    placeholderData: ZERO_STATS,
  })

  return {
    stats: data ?? ZERO_STATS,
    isLoading: !!uid && isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
