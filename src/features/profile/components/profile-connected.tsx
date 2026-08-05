'use client'

/**
 * profile-connected.tsx — integration layer for the Profile page (phase-15).
 *
 * Responsibilities:
 *   - Calls Track B hooks (useProfileHeader, useProfileStats, useProfileFeed,
 *     useToggleHeart) and maps their outputs to ProfileScreen props.
 *   - Maps ProfileKudoRow → FeedCardProps via a typed mapper.
 *   - Manages activeDirection state (SELF: received/sent; OTHER: received only).
 *   - Enforces: direction='sent' is NEVER requested for non-self profiles.
 *   - Wires onWriteKudo to open KudoComposeModal (OTHER mode only).
 *   - Wires onLoadMore to fetchNextPage.
 *   - Surfaces stats/feed errors via sonner toast.
 *
 * Note on receiverId in sent-direction cards:
 *   ProfileKudoRow (Track B contract) does not include receiver_id. For
 *   direction='received', receiverId is derived from profileId (the viewed
 *   user IS the receiver). For direction='sent', receiverId falls back to ''
 *   because Track B does not expose it — "Xem chi tiết" on sent cards will
 *   navigate to self rather than the recipient. Tracked for a Track B follow-up
 *   (extend ProfileKudoRow with receiver_id, mirroring BoardKudoRow).
 *
 * Must be rendered inside <QueryProvider> and beside a <Toaster> for toasts.
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ProfileScreen } from './profile-screen'
import { useProfileStats, useProfileHeader } from '../use-profile-stats'
import { useProfileFeed, useToggleHeart } from '../use-profile-feed'
import type { ProfileKudoRow } from '../profile-queries'
import type { FeedCardProps } from '@/features/board/components/board-types'
import type { KudosDirection, ProfileFeedItem } from './profile-types'

// ---------------------------------------------------------------------------
// Mapper — ProfileKudoRow (Track B) → FeedCardProps (Track A)
//
// ProfileKudoRow has senderId but no receiverId. For direction='received', we
// know receiverId = profileId (the viewed user is the receiver by the query
// filter). For direction='sent', receiverId is unknown from the current Track B
// contract; we pass '' — cards will render correctly but "Xem chi tiết" /
// receiver nav will not navigate to the recipient. Tracked for Track B follow-up.
// ---------------------------------------------------------------------------

function mapProfileRowToFeedCard(
  row: ProfileKudoRow,
  profileId: string,
  direction: KudosDirection,
): FeedCardProps {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    // For 'received': the viewed profile IS the receiver — derive from context.
    // For 'sent': receiver_id not in ProfileKudoRow; use '' as non-navigable fallback.
    receiverId: direction === 'received' ? profileId : '',
    receiverName: row.receiverName,
    receiverAvatarUrl: row.receiverAvatarUrl,
    contentHtml: row.contentHtml,
    heartCount: row.heartCount,
    likedByMe: row.likedByMe,
    createdAt: row.createdAt,
    // hashtags: not present in ProfileKudoRow — omitted; cards render without chips.
  }
}

// ---------------------------------------------------------------------------
// Sentinel-based infinite scroll — same approach as board-connected.tsx
// ---------------------------------------------------------------------------

const NULL_BADGES = [null, null, null, null, null, null] as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileConnectedProps {
  profileId: string
  isSelf: boolean
}

// ---------------------------------------------------------------------------
// ProfileConnected
// ---------------------------------------------------------------------------

export function ProfileConnected({ profileId, isSelf }: ProfileConnectedProps) {
  const router = useRouter()

  // ── Direction state ────────────────────────────────────────────────────────
  // OTHER mode is always 'received'. SELF mode defaults to 'received'.
  const [activeDirection, setActiveDirection] =
    useState<KudosDirection>('received')

  // Enforce: non-self profiles can never request the sent direction.
  const safeDirection: KudosDirection =
    !isSelf ? 'received' : activeDirection

  // ── Track B hooks ─────────────────────────────────────────────────────────
  const { header, isLoading: headerLoading, error: headerError } =
    useProfileHeader(profileId)

  const { stats, isLoading: statsLoading, error: statsError } =
    useProfileStats(profileId)

  const {
    allRows: feedRows,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    error: feedError,
    fetchNextPage,
  } = useProfileFeed(profileId, safeDirection)

  const { toggle, error: toggleError, clearError } = useToggleHeart()

  // Infinite scroll is driven by ProfileKudosSection's own observer (guarded on
  // hasNextPage) via onLoadMore — no second sentinel here (avoids double fetch).

  // ── Surface errors as toasts ──────────────────────────────────────────────
  useEffect(() => {
    if (headerError) toast.error(headerError)
  }, [headerError])

  useEffect(() => {
    if (statsError) toast.error(statsError)
  }, [statsError])

  useEffect(() => {
    if (feedError) toast.error(feedError)
  }, [feedError])

  useEffect(() => {
    if (toggleError) {
      toast.error(toggleError)
      clearError()
    }
  }, [toggleError, clearError])

  // ── Map feed rows → FeedCardProps ─────────────────────────────────────────
  const feedItems: ProfileFeedItem[] = feedRows.map((row: ProfileKudoRow) =>
    mapProfileRowToFeedCard(row, profileId, safeDirection),
  )

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleDirectionChange = useCallback(
    (direction: KudosDirection) => {
      // Guard: only allow direction changes in SELF mode.
      if (!isSelf) return
      setActiveDirection(direction)
    },
    [isSelf],
  )

  const handleWriteKudo = useCallback(() => {
    // No-op in SELF mode — ProfileScreen only shows the write bar in OTHER mode.
    // ProfileScreen opens KudoComposeModal internally via its own local state.
    // This callback exists for analytics / future extensibility.
  }, [])

  const handleToggleHeart = useCallback(
    (kudoId: string) => {
      toggle(kudoId)
    },
    [toggle],
  )

  const handleCopyLink = useCallback((_kudoId: string) => {
    // Copy-link logic is owned by the card component itself (clipboard + toast).
    // This prop exists for analytics integration in future phases.
  }, [])

  const handleOpenProfile = useCallback(
    (userId: string) => {
      if (!userId) return
      router.push('/profile?id=' + userId)
    },
    [router],
  )

  const handleLoadMore = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // ── Stats for the stats card ───────────────────────────────────────────────
  // ProfileStats (Track B) has `tier` and `stars` at the top level.
  // ProfileStatsProps (Track A) does NOT — tier/stars live on ProfileHeaderProps.
  // Map only the four numeric stats. Tier/stars are carried by the header prop.
  const statsProps = stats
    ? {
        received: stats.received,
        sent: stats.sent,
        hearts: stats.hearts,
        boxesOpened: stats.boxesOpened,
        boxesRemaining: stats.boxesRemaining,
      }
    : null

  // Stats card is only shown in SELF mode. For OTHER, pass null → write-bar renders.
  const statsForScreen = isSelf ? statsProps : null

  // ── Header prop — merge ProfileHeader + tier/stars from stats ────────────
  // ProfileHeaderProps expects `tier` and `stars` (from spec/Track A).
  // ProfileHeader (Track B) does not include them — they're derived in stats.
  // Stats query runs for all profiles; tier/stars from stats are the source.
  const headerForScreen = header
    ? {
        id: header.id,
        full_name: header.full_name,
        avatar_url: header.avatar_url,
        department_id: header.department_id,
        title: header.title,
        tier: stats?.tier ?? null,
        stars: stats?.stars ?? null,
      }
    : {
        // Fallback while loading — minimal valid shape.
        id: profileId,
        full_name: null,
        avatar_url: null,
        department_id: null,
        title: null,
        tier: null,
        stars: null,
      }

  // ── Counts for direction dropdown labels ──────────────────────────────────
  const receivedCount = stats?.received ?? 0
  // sentCount: null for OTHER profiles (Track B view guards this — sent = null
  // when profileId ≠ caller). Null triggers hidden 'Đã gửi' option in Track A.
  const sentCount = isSelf ? (stats?.sent ?? 0) : null

  // ── Loading guard — blank until initial data arrives ─────────────────────
  // Prevents a flash of the fallback header before the real data resolves.
  if ((headerLoading || statsLoading) && !header) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#00101A' }}
        aria-busy="true"
        aria-label="Đang tải profile…"
      />
    )
  }

  return (
    <>
      <ProfileScreen
        isSelf={isSelf}
        header={headerForScreen}
        stats={statsForScreen}
        badges={NULL_BADGES}
        activeDirection={safeDirection}
        feedItems={feedItems}
        isFeedLoading={feedLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        receivedCount={receivedCount}
        sentCount={sentCount}
        onDirectionChange={handleDirectionChange}
        onWriteKudo={handleWriteKudo}
        onToggleHeart={handleToggleHeart}
        onCopyLink={handleCopyLink}
        onOpenProfile={handleOpenProfile}
        onLoadMore={handleLoadMore}
      />
    </>
  )
}
