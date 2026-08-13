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
 *   ProfileKudoRow includes receiver_id from kudos_public. receiverId is always
 *   populated for both directions — receiver identity is public (only sender is
 *   masked for anonymous kudos). "Xem chi tiết" on sent cards correctly navigates
 *   to the receiver's profile (spec GUI_006, board TC 630f42a3).
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
// ---------------------------------------------------------------------------

function mapProfileRowToFeedCard(row: ProfileKudoRow): FeedCardProps {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    // receiverId is always populated from the query (receiver identity is
    // public). Sent-direction cards can navigate to the receiver's profile
    // (spec GUI_006, board TC 630f42a3).
    receiverId: row.receiverId,
    receiverName: row.receiverName,
    receiverAvatarUrl: row.receiverAvatarUrl,
    contentHtml: row.contentHtml,
    heartCount: row.heartCount,
    likedByMe: row.likedByMe,
    createdAt: row.createdAt,
    // Mirror board-connected-helpers.ts: only set when non-empty so FeedCard
    // skips the gallery render entirely for kudos without images.
    imageUrls: row.imageUrls.length > 0 ? row.imageUrls : undefined,
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NULL_BADGES = [null, null, null, null, null, null] as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileConnectedProps {
  profileId: string
  isSelf: boolean
  /** Authenticated viewer's own uid — forwarded to KudoComposeModal via ProfileScreen. */
  selfUid?: string
}

// ---------------------------------------------------------------------------
// ProfileConnected
// ---------------------------------------------------------------------------

export function ProfileConnected({ profileId, isSelf, selfUid }: ProfileConnectedProps) {
  const router = useRouter()

  // ── Direction state ────────────────────────────────────────────────────────
  const [activeDirection, setActiveDirection] = useState<KudosDirection>('received')

  const safeDirection: KudosDirection = !isSelf ? 'received' : activeDirection

  // ── Track B hooks ─────────────────────────────────────────────────────────
  const { header, isLoading: headerLoading, error: headerError } = useProfileHeader(profileId)
  const { stats, isLoading: statsLoading, error: statsError } = useProfileStats(profileId)

  const {
    allRows: feedRows,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    error: feedError,
    fetchNextPage,
  } = useProfileFeed(profileId, safeDirection)

  const { toggle, error: toggleError, clearError } = useToggleHeart()

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const handleDirectionChange = useCallback(
    (direction: KudosDirection) => {
      if (!isSelf) return
      setActiveDirection(direction)
    },
    [isSelf],
  )

  const handleWriteKudo = useCallback(() => {}, [])

  const handleToggleHeart = useCallback(
    (kudoId: string) => { toggle(kudoId) },
    [toggle],
  )

  const handleCopyLink = useCallback((_kudoId: string) => {}, [])

  const handleOpenProfile = useCallback(
    (userId: string) => {
      if (!userId) return
      router.push('/profile?id=' + userId)
    },
    [router],
  )

  const handleLoadMore = useCallback(() => { fetchNextPage() }, [fetchNextPage])

  // ── Error toasts ──────────────────────────────────────────────────────────
  useEffect(() => { if (headerError) toast.error(headerError) }, [headerError])
  useEffect(() => { if (statsError) toast.error(statsError) }, [statsError])
  useEffect(() => { if (feedError) toast.error(feedError) }, [feedError])
  useEffect(() => {
    if (toggleError) { toast.error(toggleError); clearError() }
  }, [toggleError, clearError])

  // ── Map feed rows → FeedCardProps ─────────────────────────────────────────
  const feedItems: ProfileFeedItem[] = feedRows.map((row: ProfileKudoRow) =>
    mapProfileRowToFeedCard(row),
  )

  // ── Stats mapping ─────────────────────────────────────────────────────────
  const statsProps = stats
    ? {
        received: stats.received,
        sent: stats.sent,
        hearts: stats.hearts,
        boxesOpened: stats.boxesOpened,
        boxesRemaining: stats.boxesRemaining,
      }
    : null

  const statsForScreen = isSelf ? statsProps : null

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
        id: profileId,
        full_name: null,
        avatar_url: null,
        department_id: null,
        title: null,
        tier: null,
        stars: null,
      }

  const receivedCount = stats?.received ?? 0
  const sentCount = isSelf ? (stats?.sent ?? 0) : null

  // ── Loading guard ─────────────────────────────────────────────────────────
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
        selfUid={selfUid}
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
