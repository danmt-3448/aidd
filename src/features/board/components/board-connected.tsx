'use client'

/**
 * BoardConnected — integration layer (phase-15) between the board page shell
 * and the presentational BoardScreen.
 *
 * Responsibilities:
 *   - Calls Track B hooks (useBoardFeed, useHighlights, useSpotlight,
 *     useToggleHeart) and maps their outputs to BoardScreen props.
 *   - Maps BoardKudoRow → FeedCardProps via a small typed mapper.
 *   - Derives unique hashtags from the flattened feed rows (Track B does not
 *     join hashtag names into board-feed rows; we surface them as undefined
 *     per card and leave hashtag chip rendering to Track A's existing logic).
 *   - Wires infinite scroll via an IntersectionObserver sentinel placed below
 *     the BoardScreen (page-level scroll — no scrollable container to pierce).
 *   - Defers sidebar pieces that have no Track B query yet (phase-05).
 *   - Surfaces toggle-heart errors via a sonner toast.
 *
 * Must be rendered inside <QueryProvider> (board page.tsx supplies it) and a
 * <Toaster> for error toasts.
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BoardScreen } from './board-screen'
import { useBoardFeed } from '../use-board-feed'
import { useHighlights } from '../use-highlights'
import { useSpotlight } from '../use-spotlight'
import { useToggleHeart } from '../use-toggle-heart'
import type { BoardKudoRow } from '../board-queries'
import type { FeedCardProps, BoardUserStats, LeaderboardEntry } from './board-types'

// ---------------------------------------------------------------------------
// Mapper — BoardKudoRow (Track B) → FeedCardProps (Track A)
//
// The two interfaces are nearly identical; only `hashtags` is absent from
// BoardKudoRow (the feed query does not join hashtag names). We omit it so
// the card renders without a chip rather than showing invented data.
// ---------------------------------------------------------------------------

function mapKudoRowToFeedCard(row: BoardKudoRow): FeedCardProps {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    receiverId: row.receiverId,
    receiverName: row.receiverName,
    receiverAvatarUrl: row.receiverAvatarUrl,
    contentHtml: row.contentHtml,
    heartCount: row.heartCount,
    likedByMe: row.likedByMe,
    createdAt: row.createdAt,
    // hashtags: omitted — board-queries does not join hashtag names into feed
    // rows. Phase-05 may extend listBoardKudos to include them.
  }
}

// ---------------------------------------------------------------------------
// DEFERRED (phase-05): real sidebar stats/leaderboards
//
// userStats, rankingLeaderboard, and giftLeaderboard belong to the
// profile_stats queries that are out-of-scope for phase-04. We provide honest
// zero/empty state here so the sidebar renders its own "Chưa có dữ liệu."
// placeholders rather than fabricated numbers.
// ---------------------------------------------------------------------------

const DEFERRED_USER_STATS: BoardUserStats = {
  kudosReceived: 0,
  kudosSent: 0,
  heartsReceived: 0,
  secretBoxCount: 0,
}

const DEFERRED_LEADERBOARD: LeaderboardEntry[] = []

// ---------------------------------------------------------------------------
// BoardConnected
// ---------------------------------------------------------------------------

export function BoardConnected() {
  const router = useRouter()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // ── Track B hooks ─────────────────────────────────────────────────────────
  const {
    allRows: feedRows,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    error: feedError,
    fetchNextPage,
  } = useBoardFeed()

  const { highlights: highlightRows, error: highlightsError } = useHighlights()
  const { nodes: spotlightNodes, error: spotlightError } = useSpotlight()
  const { toggle, error: toggleError, clearError } = useToggleHeart()

  // ── Surface query errors as toasts (non-blocking) ─────────────────────────
  useEffect(() => {
    if (feedError) {
      toast.error(feedError)
    }
  }, [feedError])

  useEffect(() => {
    if (highlightsError) {
      toast.error(highlightsError)
    }
  }, [highlightsError])

  useEffect(() => {
    if (spotlightError) {
      toast.error(spotlightError)
    }
  }, [spotlightError])

  // Surface toggle-heart errors — clear after toast so it doesn't re-fire.
  useEffect(() => {
    if (toggleError) {
      toast.error(toggleError)
      clearError()
    }
  }, [toggleError, clearError])

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  // The page itself scrolls (no inner scroll container). A sentinel div below
  // BoardScreen fires fetchNextPage when it enters the viewport.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Map Track B rows → Track A FeedCardProps ─────────────────────────────
  const feed: FeedCardProps[] = feedRows.map(mapKudoRowToFeedCard)
  const highlights: FeedCardProps[] = highlightRows.map(mapKudoRowToFeedCard)

  // Derive totalKudos from the spotlight aggregation (sum of all kudoCount
  // values reflects the total kudos in the visible dataset). Falls back to
  // 0 while spotlight hasn't resolved (feedRows.length would be misleading —
  // it only reflects the current feed page, not the total).
  const totalKudos =
    spotlightNodes.length > 0
      ? spotlightNodes.reduce((sum, n) => sum + n.kudoCount, 0)
      : 0

  // ── Callbacks ─────────────────────────────────────────────────────────────
  function handleToggleHeart(kudoId: string) {
    toggle(kudoId)
  }

  function handleCopyLink(_kudoId: string) {
    // Copy-link toast is handled inside BoardScreen itself.
    // This prop is available for analytics / URL param sync (future phase).
  }

  function handleOpenProfile(id: string) {
    router.push('/profile?id=' + id)
  }

  function handleOpenSecretBox() {
    router.push('/secret-box')
  }

  // ── Loading state — show a minimal skeleton until the first page arrives ──
  // BoardScreen renders the empty-state message itself, so we only guard the
  // case where the initial load hasn't fired at all.
  if (feedLoading && feed.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'rgba(0,16,26,1)' }}
        aria-busy="true"
        aria-label="Đang tải bảng Kudos…"
      />
    )
  }

  return (
    <>
      <BoardScreen
        highlights={highlights}
        feed={feed}
        // hashtags: unique tag strings — omitted from board-feed rows in
        // phase-04; pass empty array so the carousel filter renders no chips.
        // Phase-05 may extend the feed query to join hashtag names.
        hashtags={[]}
        spotlight={spotlightNodes}
        totalKudos={totalKudos}
        // DEFERRED (phase-05): real sidebar stats/leaderboards
        userStats={DEFERRED_USER_STATS}
        rankingLeaderboard={DEFERRED_LEADERBOARD}
        giftLeaderboard={DEFERRED_LEADERBOARD}
        onToggleHeart={handleToggleHeart}
        onCopyLink={handleCopyLink}
        onOpenProfile={handleOpenProfile}
        onOpenSecretBox={handleOpenSecretBox}
      />

      {/* Infinite-scroll sentinel — sits below BoardScreen in page flow.
          IntersectionObserver fires fetchNextPage when this div enters the
          viewport (rootMargin: 200px pre-fires before the user hits bottom).
          Invisible; no layout impact. */}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />

      {/* Loading indicator for subsequent pages */}
      {isFetchingNextPage && (
        <div
          className="flex justify-center py-4"
          style={{ backgroundColor: 'rgba(0,16,26,1)' }}
          aria-live="polite"
          aria-label="Đang tải thêm Kudos…"
        >
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: 'rgba(255,255,255,0.4)' }}
          />
        </div>
      )}
    </>
  )
}
