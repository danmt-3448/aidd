'use client'

/**
 * BoardScreen — root composer for the Sun* Kudos Live Board page.
 *
 * Layout (desktop 1280px):
 *   ┌─────────────────── full-width KV banner ───────────────────┐
 *   │              write-kudo trigger (max-w content)            │
 *   ├──────────────────────────────────┬────────────────────────-┤
 *   │  left column (flex-1)            │  right sidebar (320px)  │
 *   │  • Highlight Carousel            │  • Stats + Open Gift     │
 *   │  • All Kudos Feed                │  • Leaderboard ×2        │
 *   │  • Spotlight word-cloud          │                          │
 *   └──────────────────────────────────┴─────────────────────────┘
 *
 * Mobile (375): single column, sidebar stacks below content.
 * Tablet (768): same as mobile, sidebar at bottom.
 * Desktop (1280+): two-column layout as above.
 *
 * All data arrives as props — mock wired in board-mock.ts, real wiring in
 * integration phase (swaps mock callbacks → Track B hooks).
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
import { BoardKvBanner } from './board-kv-banner'
import { BoardWriteKudoTrigger } from './board-write-kudo-trigger'
import { BoardHighlightCarousel } from './board-highlight-carousel'
import { BoardAllKudosFeed } from './board-all-kudos-feed'
import { BoardSpotlight } from './board-spotlight'
import { BoardSidebar } from './board-sidebar'
import type { FeedCardProps, SpotlightNode, BoardUserStats, LeaderboardEntry } from './board-types'

export interface BoardScreenProps {
  /** Top-5 highlight kudos for the carousel */
  highlights: FeedCardProps[]
  /** All kudos for the main feed */
  feed: FeedCardProps[]
  /** Unique hashtag strings derived from feed cards (Track B provides; mock computes locally) */
  hashtags: string[]
  /** Spotlight word-cloud nodes */
  spotlight: SpotlightNode[]
  /** Total kudo count for spotlight header */
  totalKudos: number
  /** Sidebar stats for the current user */
  userStats: BoardUserStats
  /** Top 10 ranking leaderboard */
  rankingLeaderboard: LeaderboardEntry[]
  /** Top 10 gift leaderboard */
  giftLeaderboard: LeaderboardEntry[]
  /** Called when heart is toggled — integration wires useToggleHeart */
  onToggleHeart: (kudoId: string) => void
  /** Called when copy link is triggered */
  onCopyLink: (kudoId: string) => void
  /** Called when avatar/name/detail is clicked */
  onOpenProfile: (id: string) => void
  /** Called when "Mở quà" is clicked */
  onOpenSecretBox: () => void
}

export function BoardScreen({
  highlights,
  feed,
  hashtags,
  spotlight,
  totalKudos,
  userStats,
  rankingLeaderboard,
  giftLeaderboard,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  onOpenSecretBox,
}: BoardScreenProps) {
  const [composeOpen, setComposeOpen] = useState(false)
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)

  function handleCopyLink(kudoId: string) {
    const url = `${window.location.origin}/board?kudo=${kudoId}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('Link copied — ready to share!')
    onCopyLink(kudoId)
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'rgba(0,16,26,1)' }}
    >
      {/* KV Banner — full width */}
      <BoardKvBanner />

      {/* Content area */}
      <div className="mx-auto w-full max-w-[1512px] px-4 pb-16 pt-6 md:px-8 xl:px-16">
        {/* Write-kudo trigger — full width above columns */}
        <div className="mb-8">
          <BoardWriteKudoTrigger onOpen={() => setComposeOpen(true)} />
        </div>

        {/* Two-column layout on xl, stacked on smaller */}
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-8">
          {/* Left column — main feed content */}
          <div className="flex min-w-0 flex-1 flex-col gap-10">
            {/* Highlight carousel */}
            <BoardHighlightCarousel
              cards={highlights}
              hashtags={hashtags}
              activeHashtag={activeHashtag}
              onHashtagChange={setActiveHashtag}
              onToggleHeart={onToggleHeart}
              onCopyLink={handleCopyLink}
              onOpenProfile={onOpenProfile}
            />

            {/* All kudos feed */}
            <BoardAllKudosFeed
              cards={feed}
              onToggleHeart={onToggleHeart}
              onCopyLink={handleCopyLink}
              onOpenProfile={onOpenProfile}
            />

            {/* Spotlight word-cloud */}
            <BoardSpotlight
              nodes={spotlight}
              totalKudos={totalKudos}
              onOpenProfile={onOpenProfile}
            />
          </div>

          {/* Right sidebar — fixed width on xl */}
          <div className="w-full xl:w-[320px] xl:flex-shrink-0">
            <BoardSidebar
              stats={userStats}
              rankingLeaderboard={rankingLeaderboard}
              giftLeaderboard={giftLeaderboard}
              onOpenSecretBox={onOpenSecretBox}
            />
          </div>
        </div>
      </div>

      {/* Kudo compose modal — conditional mount */}
      {composeOpen && (
        <KudoComposeModal onClose={() => setComposeOpen(false)} />
      )}
    </div>
  )
}
