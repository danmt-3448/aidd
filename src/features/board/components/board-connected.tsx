'use client'

/**
 * BoardConnected — integration layer: renders SiteHeader (activeNav="kudos")
 * + BoardScreen. Receives server-resolved identity (uid/user/isAdmin) from
 * board/page.tsx and calls all Track B hooks. Surfaces errors via toasts.
 * Must be inside <QueryProvider> + <Toaster> (root providers.tsx).
 */

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { useUnreadCount } from '@/features/notifications/use-notifications'
import { BoardScreen } from './board-screen'
import { useBoardFeed } from '../use-board-feed'
import { useHighlights } from '../use-highlights'
import { useSpotlight } from '../use-spotlight'
import { useToggleHeart } from '../use-toggle-heart'
import { useBoardUserStats } from '../use-board-user-stats'
import { useRankingLeaderboard, useGiftLeaderboard } from '../use-board-leaderboards'
import { useHashtagList } from '../use-hashtag-list'
import type { FeedCardProps } from './board-types'
import { mapKudoRowToFeedCard } from './board-connected-helpers'

// Props — server-resolved identity passed from board/page.tsx

export interface BoardConnectedProps {
  /** Auth user id, or null when unauthenticated. */
  uid: string | null
  /** Header identity — null renders the public header (no bell/account). */
  user: { name: string; avatarUrl?: string } | null
  /** Whether the signed-in user has admin privileges (server-resolved). */
  isAdmin: boolean
}

export function BoardConnected({ uid, user, isAdmin }: BoardConnectedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Bell badge — opens realtime subscription only when uid is non-null.
  const { count: unreadCount } = useUnreadCount(uid)

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

  // ── BOARD-2: sidebar user stats (real data) ───────────────────────────────
  const { stats: userStats, error: statsError } = useBoardUserStats(uid)

  // ── BOARD-3 + BOARD-4: leaderboards ──────────────────────────────────────
  const { entries: rankingLeaderboard, error: rankingError } = useRankingLeaderboard()
  const { entries: giftLeaderboard, error: giftError } = useGiftLeaderboard()

  // ── BOARD-1: hashtag chips ────────────────────────────────────────────────
  const { hashtags: hashtagList, nameToId } = useHashtagList()

  // Derive the display-name list for the carousel chips (e.g. ["ThanhOm", ...]).
  // The carousel shows names; clicking routes via UUID URL param.
  const hashtagNames = hashtagList.map((h) => h.name)

  // Active hashtag display name — derived from current URL param UUID.
  const activeHashtagId = searchParams.get('hashtag')
  const activeHashtag = activeHashtagId
    ? (hashtagList.find((h) => h.id === activeHashtagId)?.name ?? null)
    : null

  // ── Hashtag routing ───────────────────────────────────────────────────────
  // Push ?hashtag=<uuid> when a chip is clicked. Passing null clears the param.
  // Feed + spotlight both read searchParams.get('hashtag') directly via their
  // own useSearchParams() calls — no prop drilling needed.
  const handleHashtagChange = useCallback(
    (name: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (name === null) {
        params.delete('hashtag')
      } else {
        const id = nameToId.get(name)
        if (id) {
          params.set('hashtag', id)
        } else {
          params.delete('hashtag')
        }
      }
      router.push('?' + params.toString(), { scroll: false })
    },
    [router, searchParams, nameToId],
  )

  // ── Surface query errors as toasts (non-blocking) ─────────────────────────
  useEffect(() => { if (feedError) toast.error(feedError) }, [feedError])
  useEffect(() => { if (highlightsError) toast.error(highlightsError) }, [highlightsError])
  useEffect(() => { if (spotlightError) toast.error(spotlightError) }, [spotlightError])
  useEffect(() => { if (statsError) toast.error(statsError) }, [statsError])
  useEffect(() => { if (rankingError) toast.error(rankingError) }, [rankingError])
  useEffect(() => { if (giftError) toast.error(giftError) }, [giftError])

  // Surface toggle-heart errors — clear after toast so it doesn't re-fire.
  useEffect(() => {
    if (toggleError) {
      toast.error(toggleError)
      clearError()
    }
  }, [toggleError, clearError])

  // ── Infinite scroll sentinel — page-level scroll, rootMargin pre-fires ───
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

  const feed: FeedCardProps[] = feedRows.map(mapKudoRowToFeedCard)
  const highlights: FeedCardProps[] = highlightRows.map(mapKudoRowToFeedCard)

  // Sum spotlight kudoCount for the header total; falls back to 0 until resolved.
  const totalKudos =
    spotlightNodes.length > 0
      ? spotlightNodes.reduce((sum, n) => sum + n.kudoCount, 0)
      : 0

  function handleToggleHeart(kudoId: string) {
    toggle(kudoId)
  }

  function handleCopyLink(_kudoId: string) {
    // Copy-link toast is handled inside BoardScreen itself.
  }

  function handleOpenProfile(id: string) {
    router.push('/profile?id=' + id)
  }

  function handleOpenSecretBox() {
    router.push('/secret-box')
  }

  const header = (
    <SiteHeader user={user} unreadCount={unreadCount} uid={uid} isAdmin={isAdmin} activeNav="kudos" />
  )

  if (feedLoading && feed.length === 0) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
        {header}
        <div
          className="flex flex-1 items-center justify-center"
          style={{ minHeight: 'calc(100vh - 80px)' }}
          aria-busy="true"
          aria-label="Đang tải bảng Kudos…"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
      {header}

      <BoardScreen
        highlights={highlights}
        feed={feed}
        hashtags={hashtagNames}
        activeHashtag={activeHashtag}
        spotlight={spotlightNodes}
        totalKudos={totalKudos}
        userStats={userStats}
        rankingLeaderboard={rankingLeaderboard}
        giftLeaderboard={giftLeaderboard}
        onHashtagChange={handleHashtagChange}
        onToggleHeart={handleToggleHeart}
        onCopyLink={handleCopyLink}
        onOpenProfile={handleOpenProfile}
        onOpenSecretBox={handleOpenSecretBox}
      />

      {/* Infinite-scroll sentinel — invisible, triggers fetchNextPage */}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />

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
    </div>
  )
}
