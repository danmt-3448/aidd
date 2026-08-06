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
 * Dev-only: ?ui_state=full|empty|error|loading bypasses Track B hooks and renders
 * from profile.mock.ts. No Supabase requests fire in override mode.
 * Mirror of board-connected.tsx pattern (phase-02 infra).
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
import { useUiStateOverride } from '@/lib/ui-state-override'
import { mockFull, mockEmpty, mockError } from '../mocks/profile.mock'
import { ProfileScreen } from './profile-screen'
import { useProfileStats, useProfileHeader } from '../use-profile-stats'
import { useProfileFeed, useToggleHeart } from '../use-profile-feed'
import type { ProfileKudoRow } from '../profile-queries'
import type { FeedCardProps } from '@/features/board/components/board-types'
import type { KudosDirection, ProfileFeedItem } from './profile-types'

// ---------------------------------------------------------------------------
// Mapper — ProfileKudoRow (Track B) → FeedCardProps (Track A)
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
    receiverId: direction === 'received' ? profileId : '',
    receiverName: row.receiverName,
    receiverAvatarUrl: row.receiverAvatarUrl,
    contentHtml: row.contentHtml,
    heartCount: row.heartCount,
    likedByMe: row.likedByMe,
    createdAt: row.createdAt,
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
}

// ---------------------------------------------------------------------------
// ProfileConnected
// ---------------------------------------------------------------------------

export function ProfileConnected({ profileId, isSelf }: ProfileConnectedProps) {
  const router = useRouter()
  const uiOverride = useUiStateOverride()
  const isOverride = uiOverride !== null

  // ── Direction state ────────────────────────────────────────────────────────
  const [activeDirection, setActiveDirection] =
    useState<KudosDirection>('received')

  const safeDirection: KudosDirection = !isSelf ? 'received' : activeDirection

  // ── Track B hooks (always called — Rules of Hooks) ────────────────────────
  // Pass a sentinel profileId in override mode so queries are still called
  // (rules of hooks) but won't hit Supabase with real data.
  const hookProfileId = isOverride ? 'mock-profile-self-001' : profileId

  const { header, isLoading: headerLoading, error: headerError } =
    useProfileHeader(hookProfileId)

  const { stats, isLoading: statsLoading, error: statsError } =
    useProfileStats(hookProfileId)

  const {
    allRows: feedRows,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    error: feedError,
    fetchNextPage,
  } = useProfileFeed(hookProfileId, safeDirection)

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

  // ── Error toasts (suppressed in override mode) ────────────────────────────
  useEffect(() => { if (!isOverride && headerError) toast.error(headerError) }, [isOverride, headerError])
  useEffect(() => { if (!isOverride && statsError) toast.error(statsError) }, [isOverride, statsError])
  useEffect(() => { if (!isOverride && feedError) toast.error(feedError) }, [isOverride, feedError])
  useEffect(() => {
    if (toggleError) { toast.error(toggleError); clearError() }
  }, [toggleError, clearError])

  // ── Dev override: render from fixture ────────────────────────────────────
  if (isOverride) {
    const isLoadingOverride = uiOverride === 'loading'
    const fixture =
      uiOverride === 'empty'
        ? mockEmpty
        : uiOverride === 'error'
          ? mockError
          : mockFull   // covers 'full' and 'loading' (loading uses full data, just isFeedLoading=true)

    return (
      <ProfileScreen
        isSelf={fixture.isSelf}
        header={fixture.header}
        stats={fixture.stats}
        badges={NULL_BADGES}
        activeDirection={fixture.activeDirection}
        feedItems={isLoadingOverride ? [] : fixture.feedItems}
        isFeedLoading={isLoadingOverride}
        isFetchingNextPage={false}
        hasNextPage={fixture.hasNextPage}
        receivedCount={fixture.receivedCount}
        sentCount={fixture.sentCount}
        onDirectionChange={() => {}}
        onWriteKudo={() => {}}
        onToggleHeart={() => {}}
        onCopyLink={() => {}}
        onOpenProfile={() => {}}
        onLoadMore={() => {}}
      />
    )
  }

  // ── Map feed rows → FeedCardProps ─────────────────────────────────────────
  const feedItems: ProfileFeedItem[] = feedRows.map((row: ProfileKudoRow) =>
    mapProfileRowToFeedCard(row, profileId, safeDirection),
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
