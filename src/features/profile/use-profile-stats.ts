'use client'

import { useQuery } from '@tanstack/react-query'
import { getProfileStats, getProfileHeader } from './profile-queries'
import type { ProfileStats, ProfileHeader } from './profile-queries'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const profileKeys = {
  all: ['profile'] as const,
  stats: (profileId: string) => [...profileKeys.all, 'stats', profileId] as const,
  header: (profileId: string) => [...profileKeys.all, 'header', profileId] as const,
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface UseProfileStatsReturn {
  stats: ProfileStats | null
  isLoading: boolean
  error: string | null
}

export interface UseProfileHeaderReturn {
  header: ProfileHeader | null
  isLoading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// useProfileStats
//
// Fetches aggregated stats for the given profile.
// `sent` will be null when profileId differs from the calling user (server
// enforced via the profile_stats view security_invoker guard).
// ---------------------------------------------------------------------------

export function useProfileStats(profileId: string): UseProfileStatsReturn {
  const query = useQuery({
    queryKey: profileKeys.stats(profileId),
    queryFn: async () => {
      const result = await getProfileStats(profileId)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    enabled: Boolean(profileId),
    staleTime: 60_000,
  })

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  }
}

// ---------------------------------------------------------------------------
// useProfileHeader
//
// Fetches the public header fields for the given profile (explicit allowlist,
// no email). Safe to call for any profile id including other users.
// ---------------------------------------------------------------------------

export function useProfileHeader(profileId: string): UseProfileHeaderReturn {
  const query = useQuery({
    queryKey: profileKeys.header(profileId),
    queryFn: async () => {
      const result = await getProfileHeader(profileId)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    enabled: Boolean(profileId),
    staleTime: 60_000,
  })

  return {
    header: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  }
}
