'use client'

/**
 * BoardConnected — integration layer: renders SiteHeader (activeNav="kudos")
 * + BoardScreen. Receives server-resolved identity (uid/user/isAdmin) from
 * board/page.tsx and calls all Track B hooks. Surfaces errors via toasts.
 * Must be inside <QueryProvider> + <Toaster> (root providers.tsx).
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { useUnreadCount } from '@/features/notifications/use-notifications'
import { KudoComposeModal, type KudoInitialData } from '@/features/kudos/components/kudo-compose-modal'
import { getKudoForEdit } from '@/features/kudos/kudo-actions'
import { BoardScreen } from './board-screen'
import { useBoardFeed } from '../use-board-feed'
import { useHighlights } from '../use-highlights'
import { useSpotlight } from '../use-spotlight'
import { useToggleHeart } from '../use-toggle-heart'
import { useBoardUserStats } from '../use-board-user-stats'
import { useGiftLeaderboard } from '../use-board-leaderboards'
import { useHashtagList } from '../use-hashtag-list'
import { useDepartmentList } from '../use-department-list'
import { mapKudoRowToFeedCard } from './board-connected-helpers'
import { BoardLoadingGate, BoardErrorGate } from './board-connected-gates'
import { useSpotlightActivity } from '../use-spotlight-activity'

export interface BoardConnectedProps {
  uid: string | null
  user: { name: string; avatarUrl?: string } | null
  isAdmin: boolean
  /**
   * Pre-open the KudoComposeModal on mount.
   * Injected by /kudos route via ?modal=compose.
   * Passed straight through to BoardScreen as initialComposeOpen.
   */
  initialComposeOpen?: boolean
}

export function BoardConnected({ uid, user, isAdmin, initialComposeOpen = false }: BoardConnectedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Edit-kudo modal state ─────────────────────────────────────────────────
  const [editKudoId, setEditKudoId] = useState<string | null>(null)
  const [editInitialData, setEditInitialData] = useState<KudoInitialData | null>(null)

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
  const { activity, error: activityError } = useSpotlightActivity()
  const { toggle, error: toggleError, clearError } = useToggleHeart()
  const { stats: userStats, error: statsError } = useBoardUserStats(uid)
  const { entries: giftLeaderboard, error: giftError } = useGiftLeaderboard()
  const { hashtags: hashtagList, nameToId: hashtagNameToId } = useHashtagList()
  const { departments: departmentList, nameToId: deptNameToId, error: deptListError } = useDepartmentList()

  // ── Map rows ──────────────────────────────────────────────────────────────
  const feed = feedRows.map(mapKudoRowToFeedCard)
  const highlights = highlightRows.map(mapKudoRowToFeedCard)
  const totalKudos = spotlightNodes.reduce((sum, n) => sum + n.kudoCount, 0)
  const hashtagNames = hashtagList.map((h) => h.name)
  const departmentNames = departmentList.map((d) => d.name)

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

  // ── Error toasts ──────────────────────────────────────────────────────────
  useEffect(() => { if (feedError) toast.error(feedError) }, [feedError])
  useEffect(() => { if (highlightsError) toast.error(highlightsError) }, [highlightsError])
  useEffect(() => { if (spotlightError) toast.error(spotlightError) }, [spotlightError])
  useEffect(() => { if (activityError) toast.error(activityError) }, [activityError])
  useEffect(() => { if (statsError) toast.error(statsError) }, [statsError])
  useEffect(() => { if (giftError) toast.error(giftError) }, [giftError])
  useEffect(() => { if (deptListError) toast.error(deptListError) }, [deptListError])
  useEffect(() => { if (toggleError) { toast.error(toggleError); clearError() } }, [toggleError, clearError])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleEdit = useCallback(async (kudoId: string) => {
    const result = await getKudoForEdit(kudoId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setEditInitialData(result.data)
    setEditKudoId(kudoId)
  }, [])

  const header = (
    <SiteHeader user={user} unreadCount={unreadCount} uid={uid} isAdmin={isAdmin} activeNav="kudos" />
  )

  // Loading / error skeleton gates — shell components in board-connected-helpers.tsx
  if (feedLoading && feed.length === 0) return <BoardLoadingGate header={header} />
  if (feedError && feed.length === 0) return <BoardErrorGate header={header} />

  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: 'rgba(0,16,26,1)' }}>
      {header}
      <BoardScreen
        highlights={highlights}
        feed={feed}
        hashtags={hashtagNames}
        activeHashtag={activeHashtag}
        departments={departmentNames}
        activeDepartment={activeDepartment}
        spotlight={spotlightNodes}
        spotlightActivity={activity}
        totalKudos={totalKudos}
        userStats={userStats}
        giftLeaderboard={giftLeaderboard}
        onHashtagChange={handleHashtagChange}
        onDepartmentChange={handleDepartmentChange}
        onToggleHeart={(kudoId) => { toggle(kudoId) }}
        onCopyLink={() => { /* handled inside BoardScreen */ }}
        onOpenProfile={(id) => router.push('/profile?' + new URLSearchParams({ id }).toString())}
        onOpenSecretBox={() => router.push('/secret-box')}
        isLoading={feedLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={handleLoadMore}
        resolvedUserId={uid ?? undefined}
        initialComposeOpen={initialComposeOpen}
        onEdit={handleEdit}
      />

      {/* Edit-kudo modal — mounts only when pencil is clicked on own kudo */}
      {editKudoId && editInitialData && (
        <KudoComposeModal
          editKudoId={editKudoId}
          editInitialData={editInitialData}
          resolvedUserId={uid ?? undefined}
          onClose={() => {
            setEditKudoId(null)
            setEditInitialData(null)
          }}
        />
      )}
    </div>
  )
}
