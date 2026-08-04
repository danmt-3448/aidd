'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSecretBoxState,
  openSecretBox,
  type SecretBoxState,
} from './secret-box-actions'
import { badgeAsset } from './badge-assets'
import type { BadgeInfo } from './components/secret-box-types'

// ---------------------------------------------------------------------------
// Query key — stable, colocated with the hook that uses it.
// ---------------------------------------------------------------------------

const SECRET_BOX_QUERY_KEY = ['secret-box', 'state'] as const

/** Resolve a badge image path, warning on allowlist misses so key drift is visible. */
function resolveBadgeAsset(badgeKey: string): string {
  const asset = badgeAsset(badgeKey)
  if (!asset) {
    console.warn('[useSecretBox] unknown badge key, using fallback:', badgeKey)
    return '/rules/badge-stay-gold.png'
  }
  return asset
}

// ---------------------------------------------------------------------------
// Return type — integration contract for SecretBoxModal (phase 14).
// Props: { unopened, currentBadge: BadgeInfo|null, isOpening, onOpen, onClose? }
// ---------------------------------------------------------------------------

export interface UseSecretBoxReturn {
  /** Count of boxes still available to open. */
  unopened: number
  /** Badge revealed by the most recent successful open; null before any open. */
  currentBadge: BadgeInfo | null
  /** True while the openSecretBox RPC is in flight. */
  isOpening: boolean
  /** True if the state query has not yet resolved. */
  isLoading: boolean
  /** Non-null when the state query itself fails (distinct from an open failure). */
  stateError: string | null
  /** Non-null when the open mutation fails. */
  openError: string | null
  /** Fire to request opening a box. No-op when unopened === 0. */
  open: () => void
  /** Clears openError after the user acknowledges it. */
  clearError: () => void
}

// ---------------------------------------------------------------------------
// useSecretBox
// ---------------------------------------------------------------------------

export function useSecretBox(): UseSecretBoxReturn {
  const queryClient = useQueryClient()

  // ── State query ────────────────────────────────────────────────────────────
  const stateQuery = useQuery<SecretBoxState, Error>({
    queryKey: SECRET_BOX_QUERY_KEY,
    queryFn: async () => {
      const result = await getSecretBoxState()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 30 * 1000, // 30 s — count is authoritative on the server
  })

  const unopened = stateQuery.data?.unopened ?? 0
  const openedBadges = stateQuery.data?.opened ?? []

  // Derive currentBadge from the most recently opened entry.
  const latestBadgeKey = openedBadges[0]?.badgeKey ?? null
  const currentBadge: BadgeInfo | null =
    latestBadgeKey !== null
      ? {
          key: latestBadgeKey,
          imageSrc: resolveBadgeAsset(latestBadgeKey),
        }
      : null

  // ── Open mutation ──────────────────────────────────────────────────────────
  // retry: 0 — opening is non-idempotent; a retry on transient error would
  // decrement the count a second time.
  const openMutation = useMutation<
    { badgeKey: string; remaining: number },
    Error
  >({
    mutationFn: async () => {
      const result = await openSecretBox()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    retry: 0,
    onSuccess: (rpcData) => {
      // Optimistically update the cached state so the UI reflects the new
      // badge and counter without waiting for a full refetch.
      queryClient.setQueryData<SecretBoxState>(SECRET_BOX_QUERY_KEY, (prev) => {
        if (!prev) return prev
        const newBadge = {
          badgeKey: rpcData.badgeKey,
          openedAt: new Date().toISOString(),
        }
        return {
          unopened: rpcData.remaining,
          opened: [newBadge, ...prev.opened],
        }
      })
    },
    onError: () => {
      // Invalidate so count re-syncs from server on next access.
      queryClient.invalidateQueries({ queryKey: SECRET_BOX_QUERY_KEY })
    },
  })

  // ── open() — guarded at zero ───────────────────────────────────────────────
  function open() {
    if (unopened === 0 || openMutation.isPending) return
    openMutation.mutate()
  }

  function clearError() {
    openMutation.reset()
  }

  return {
    unopened,
    currentBadge,
    isOpening: openMutation.isPending,
    isLoading: stateQuery.isLoading,
    stateError: stateQuery.error?.message ?? null,
    openError: openMutation.error?.message ?? null,
    open,
    clearError,
  }
}
