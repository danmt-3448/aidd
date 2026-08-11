'use client'

/**
 * use-user-hover-card.ts — TanStack Query hook for the board avatar hover popup.
 *
 * Fetches { department, tier, kudosReceived, kudosSent } for a given profileId.
 * The hook is enabled only when profileId is non-null so callers can
 * conditionally pass null to suppress the request (e.g. anonymous sender).
 *
 * staleTime: 60 s — hover cards appear briefly; frequent re-fetch wastes tokens.
 * The data does not change while the user views the board.
 */

import { useQuery } from '@tanstack/react-query'
import { getUserHoverCardData } from './user-hover-card-actions'
import type { UserHoverCardData } from './user-hover-card-actions'

// ---------------------------------------------------------------------------
// Query key factory — consistent shape for targeted invalidation.
// ---------------------------------------------------------------------------

export const userHoverCardKeys = {
  all: ['board', 'userHoverCard'] as const,
  byProfile: (profileId: string) =>
    [...userHoverCardKeys.all, profileId] as const,
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseUserHoverCardReturn {
  data: UserHoverCardData | null
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useUserHoverCard
//
// profileId: uuid of the profile to show in the hover card.
//            Pass null for anonymous senders — query is disabled, returns nulls.
// ---------------------------------------------------------------------------

export function useUserHoverCard(
  profileId: string | null,
): UseUserHoverCardReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: profileId
      ? userHoverCardKeys.byProfile(profileId)
      : userHoverCardKeys.all,
    queryFn: async () => {
      if (!profileId) return null
      const result = await getUserHoverCardData(profileId)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    enabled: !!profileId,
    staleTime: 60_000,
  })

  return {
    data: data ?? null,
    isLoading: !!profileId && isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
