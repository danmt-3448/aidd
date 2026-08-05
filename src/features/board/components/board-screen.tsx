'use client'

/**
 * BoardScreen — root composer for the Sun* Kudos Live Board page.
 *
 * Layout (desktop 1440px per Figma):
 *   ┌──────────────────── full-width KV banner (512px) ────────────────────┐
 *   │          write-kudo trigger + profile search row (144px padding)     │
 *   │  ── Highlight Carousel (FULL WIDTH) ──────────────────────────────── │
 *   │  ── Spotlight Board (FULL WIDTH) ─────────────────────────────────── │
 *   ├──────────────────────────────────────┬───────────────────────────────┤
 *   │  All Kudos feed (flex-1)             │  right sidebar (374px)        │
 *   │                                      │  • Stats + Open Gift          │
 *   │                                      │  • 10 Sunner Nhận Quà         │
 *   └──────────────────────────────────────┴───────────────────────────────┘
 *
 * Rework pass 2 (D7): rankingLeaderboard removed — Figma has only gift list.
 * Rework pass 2 (D4): profile search wired through BoardWriteKudoTrigger.
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
import { HomepageFooter } from '@/features/homepage/components/homepage-footer'
import type { FeedCardProps, SpotlightNode, BoardUserStats, LeaderboardEntry, SpotlightActivityEntry } from './board-types'

export interface BoardScreenProps {
  highlights: FeedCardProps[]
  feed: FeedCardProps[]
  hashtags: string[]
  activeHashtag: string | null
  departments: string[]
  activeDepartment: string | null
  spotlight: SpotlightNode[]
  spotlightActivity: SpotlightActivityEntry[]
  totalKudos: number
  userStats: BoardUserStats
  /** Top-10 gift recipients — only leaderboard shown per Figma D7 */
  giftLeaderboard: LeaderboardEntry[]
  onHashtagChange: (tag: string | null) => void
  onDepartmentChange: (name: string | null) => void
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (id: string) => void
  onOpenSecretBox: () => void
}

export function BoardScreen({
  highlights,
  feed,
  hashtags,
  activeHashtag,
  departments,
  activeDepartment,
  spotlight,
  spotlightActivity,
  totalKudos,
  userStats,
  giftLeaderboard,
  onHashtagChange,
  onDepartmentChange,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  onOpenSecretBox,
}: BoardScreenProps) {
  const [composeOpen, setComposeOpen] = useState(false)

  function handleCopyLink(kudoId: string) {
    const url = `${window.location.origin}/board?kudo=${kudoId}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('Link copied — ready to share!')
    onCopyLink(kudoId)
  }

  return (
    <div className="w-full">
      {/* KV Banner — full width */}
      <BoardKvBanner />

      {/* Content area — 144px horizontal padding on desktop per Figma.
          Negative top margin pulls the search row up to overlap the banner base (Figma). */}
      <div className="relative z-30 mx-auto -mt-20 w-full max-w-[1440px] px-4 pb-20 md:px-10 lg:px-[144px]">
        {/* Write-kudo + profile search row (D4) */}
        <div className="mb-10">
          <BoardWriteKudoTrigger
            onOpen={() => setComposeOpen(true)}
            onProfileSearch={(q) => {
              // Profile search handler — integration phase wires to router/search
              void q
            }}
          />
        </div>

        {/* Highlight Carousel — FULL WIDTH (outside 2-col layout per Figma) */}
        <div className="mb-16">
          <BoardHighlightCarousel
            cards={highlights}
            hashtags={hashtags}
            activeHashtag={activeHashtag}
            onHashtagChange={onHashtagChange}
            departments={departments}
            activeDepartment={activeDepartment}
            onDepartmentChange={onDepartmentChange}
            onToggleHeart={onToggleHeart}
            onCopyLink={handleCopyLink}
            onOpenProfile={onOpenProfile}
          />
        </div>

        {/* Spotlight Board — FULL WIDTH (outside 2-col layout per Figma) */}
        <div className="mb-16">
          <BoardSpotlight
            nodes={spotlight}
            totalKudos={totalKudos}
            activityLog={spotlightActivity}
            onOpenProfile={onOpenProfile}
          />
        </div>

        {/* Two-column layout: All Kudos feed (flex-1) + Sidebar (374px) — per Figma */}
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
          {/* Left column — all kudos feed */}
          <div className="min-w-0 flex-1">
            <BoardAllKudosFeed
              cards={feed}
              onToggleHeart={onToggleHeart}
              onCopyLink={handleCopyLink}
              onOpenProfile={onOpenProfile}
            />
          </div>

          {/* Right sidebar — 374px per Figma */}
          <div className="w-full xl:w-[374px] xl:flex-shrink-0">
            <BoardSidebar
              stats={userStats}
              giftLeaderboard={giftLeaderboard}
              onOpenSecretBox={onOpenSecretBox}
            />
          </div>
        </div>
      </div>

      {/* Site footer — same shared footer as homepage (Figma board has it too) */}
      <HomepageFooter />

      {composeOpen && (
        <KudoComposeModal onClose={() => setComposeOpen(false)} />
      )}
    </div>
  )
}
