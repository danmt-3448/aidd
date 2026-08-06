'use client'

/**
 * BoardConnected — integration layer: renders SiteHeader (activeNav="kudos")
 * + BoardScreen. Receives server-resolved identity (uid/user/isAdmin) from
 * board/page.tsx and calls all Track B hooks. Surfaces errors via toasts.
 * Must be inside <QueryProvider> + <Toaster> (root providers.tsx).
 *
 * Dev-only: ?ui_state=full|empty|error|loading bypasses Supabase/realtime
 * and renders from board-mock.ts. No side-effect channels fire in override mode.
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
import { useGiftLeaderboard } from '../use-board-leaderboards'
import { useHashtagList } from '../use-hashtag-list'
import { useDepartmentList } from '../use-department-list'
import { useUiStateOverride } from '@/lib/ui-state-override'
import { resolveOverrideData } from './board-connected-helpers'

export interface BoardConnectedProps {
  uid: string | null
  user: { name: string; avatarUrl?: string } | null
  isAdmin: boolean
  /**
   * Dev/test harness only — pre-open the KudoComposeModal on mount.
   * Injected by KudosDevWrapper (/kudos route) via ?modal=compose.
   * Passed straight through to BoardScreen as initialComposeOpen.
   */
  initialComposeOpen?: boolean
}

export function BoardConnected({ uid, user, isAdmin, initialComposeOpen = false }: BoardConnectedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const uiOverride = useUiStateOverride()
  const isOverride = uiOverride !== null

  const { count: unreadCount } = useUnreadCount(uid)

  // ── Track B hooks (always called — Rules of Hooks) ────────────────────────
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
  const { stats: userStats, error: statsError } = useBoardUserStats(uid)
  const { entries: giftLeaderboard, error: giftError } = useGiftLeaderboard()
  const { hashtags: hashtagList, nameToId: hashtagNameToId } = useHashtagList()
  const { departments: departmentList, nameToId: deptNameToId, error: deptListError } = useDepartmentList()

  // ── Resolve data (override wins when active) ──────────────────────────────
  const resolved = resolveOverrideData(uiOverride, {
    feedRows,
    highlightRows,
    spotlightNodes,
    userStats,
    giftLeaderboard,
    hashtagNames: hashtagList.map((h) => h.name),
    departmentNames: departmentList.map((d) => d.name),
    feedLoading,
    feedError,
  })

  // ── Routing helpers ───────────────────────────────────────────────────────
  const activeHashtagId = searchParams.get('hashtag')
  const activeHashtag = activeHashtagId
    ? (hashtagList.find((h) => h.id === activeHashtagId)?.name ?? null)
    : null

  const activeDeptId = searchParams.get('department')
  const activeDepartment = activeDeptId
    ? (departmentList.find((d) => d.id === activeDeptId)?.name ?? null)
    : null

  const handleHashtagChange = useCallback(
    (name: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (name === null) {
        params.delete('hashtag')
      } else {
        const id = hashtagNameToId.get(name)
        if (id) params.set('hashtag', id)
        else params.delete('hashtag')
      }
      router.push('?' + params.toString(), { scroll: false })
    },
    [router, searchParams, hashtagNameToId],
  )

  const handleDepartmentChange = useCallback(
    (name: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (name === null) {
        params.delete('department')
      } else {
        const id = deptNameToId.get(name)
        if (id) params.set('department', id)
        else params.delete('department')
      }
      router.push('?' + params.toString(), { scroll: false })
    },
    [router, searchParams, deptNameToId],
  )

  // ── Error toasts (suppressed in override mode) ────────────────────────────
  // Each error needs its own effect so React can track per-dependency changes.
  useEffect(() => { if (!isOverride && feedError) toast.error(feedError) }, [isOverride, feedError])
  useEffect(() => { if (!isOverride && highlightsError) toast.error(highlightsError) }, [isOverride, highlightsError])
  useEffect(() => { if (!isOverride && spotlightError) toast.error(spotlightError) }, [isOverride, spotlightError])
  useEffect(() => { if (!isOverride && statsError) toast.error(statsError) }, [isOverride, statsError])
  useEffect(() => { if (!isOverride && giftError) toast.error(giftError) }, [isOverride, giftError])
  useEffect(() => { if (!isOverride && deptListError) toast.error(deptListError) }, [isOverride, deptListError])
  useEffect(() => { if (toggleError) { toast.error(toggleError); clearError() } }, [toggleError, clearError])

  // ── Infinite scroll (disabled in override mode) ───────────────────────────
  useEffect(() => {
    if (isOverride) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isOverride, hasNextPage, isFetchingNextPage, fetchNextPage])

  const header = (
    <SiteHeader user={user} unreadCount={unreadCount} uid={uid} isAdmin={isAdmin} activeNav="kudos" />
  )

  // Loading skeleton gate
  if (resolved.feedLoading && resolved.feed.length === 0) {
    return (
      <div className="relative min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
        {header}
        <div className="flex flex-1 flex-col items-center justify-center gap-4" style={{ minHeight: 'calc(100vh - 80px)' }}
          role="status" aria-busy="true" aria-label="Đang tải bảng Kudos…">
          <div
            className="h-10 w-10 animate-spin rounded-full"
            style={{ border: '3px solid rgba(255,234,158,0.25)', borderTopColor: '#FFEA9E' }}
          />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Đang tải bảng Kudos…</p>
        </div>
      </div>
    )
  }

  // Error gate
  if (resolved.feedError && resolved.feed.length === 0) {
    return (
      <div className="relative min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
        {header}
        <div className="flex flex-1 items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}
          role="alert" aria-label="Lỗi tải bảng Kudos">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Không thể tải dữ liệu. Vui lòng thử lại.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
      {header}
      <BoardScreen
        highlights={resolved.highlights}
        feed={resolved.feed}
        hashtags={resolved.hashtagNames}
        activeHashtag={activeHashtag}
        departments={resolved.departmentNames}
        activeDepartment={activeDepartment}
        spotlight={resolved.spotlightNodes}
        spotlightActivity={resolved.spotlightActivity}
        totalKudos={resolved.totalKudos}
        userStats={resolved.userStats}
        giftLeaderboard={resolved.giftLeaderboard}
        onHashtagChange={handleHashtagChange}
        onDepartmentChange={handleDepartmentChange}
        onToggleHeart={(kudoId) => { if (!isOverride) toggle(kudoId) }}
        onCopyLink={() => { /* handled inside BoardScreen */ }}
        onOpenProfile={(id) => router.push('/profile?id=' + id)}
        onOpenSecretBox={() => router.push('/secret-box')}
        isLoading={resolved.feedLoading}
        initialComposeOpen={initialComposeOpen}
      />

      {!isOverride && <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />}

      {!isOverride && isFetchingNextPage && (
        <div className="flex justify-center py-4" style={{ backgroundColor: 'rgba(0,16,26,1)' }}
          aria-live="polite" aria-label="Đang tải thêm Kudos…">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
        </div>
      )}
    </div>
  )
}
