'use client'

/**
 * BoardSidebar — right-column panel with user stats + two leaderboards.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Sidebar bg: rgba(255,255,255,0.02), border: 1px solid rgba(255,255,255,0.06)
 *   radius 16px, padding 24px, gap 24px between sections.
 *
 * Sub-components extracted to stay under 200 lines per file:
 *   StatsCard      → board-sidebar-stats.tsx
 *   SidebarLeaderboard → board-sidebar-leaderboard.tsx
 */

import { StatsCard } from './board-sidebar-stats'
import { SidebarLeaderboard } from './board-sidebar-leaderboard'
import type { BoardUserStats, LeaderboardEntry } from './board-types'

export interface BoardSidebarProps {
  stats: BoardUserStats
  rankingLeaderboard: LeaderboardEntry[]
  giftLeaderboard: LeaderboardEntry[]
  onOpenSecretBox: () => void
}

export function BoardSidebar({
  stats,
  rankingLeaderboard,
  giftLeaderboard,
  onOpenSecretBox,
}: BoardSidebarProps) {
  return (
    <aside
      aria-label="Thống kê và bảng xếp hạng"
      className="flex flex-col gap-6"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      {/* User stats + open gift */}
      <StatsCard stats={stats} onOpenSecretBox={onOpenSecretBox} />

      <div aria-hidden style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* 10 Sunner thăng hạng */}
      <SidebarLeaderboard
        title="10 Sunner Thăng Hạng"
        entries={rankingLeaderboard}
        scoreLabel="kudos"
      />

      <div aria-hidden style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* 10 Sunner nhận quà */}
      <SidebarLeaderboard
        title="10 Sunner Nhận Quà"
        entries={giftLeaderboard}
        scoreLabel="quà"
      />
    </aside>
  )
}
