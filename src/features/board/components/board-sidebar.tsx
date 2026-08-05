'use client'

/**
 * BoardSidebar — right-column panel with user stats + gift leaderboard.
 *
 * Rework pass 2 (D7):
 *   D7 — Figma shows ONLY "10 SUNNER NHẬN QUÀ MỚI NHẤT" in the sidebar.
 *        Ranking leaderboard ("THĂNG HẠNG") is NOT present in the design.
 *        rankingLeaderboard prop removed from this component.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Sidebar bg: rgba(255,255,255,0.02), border 1px solid rgba(255,255,255,0.06)
 *   radius 16px, padding 24px, gap 24px between sections.
 */

import { StatsCard } from './board-sidebar-stats'
import { SidebarLeaderboard } from './board-sidebar-leaderboard'
import type { BoardUserStats, LeaderboardEntry } from './board-types'

export interface BoardSidebarProps {
  stats: BoardUserStats
  /** Top-10 gift recipients — only leaderboard shown per Figma D7 */
  giftLeaderboard: LeaderboardEntry[]
  onOpenSecretBox: () => void
}

export function BoardSidebar({
  stats,
  giftLeaderboard,
  onOpenSecretBox,
}: BoardSidebarProps) {
  return (
    <aside
      aria-label="Thống kê và danh sách nhận quà"
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

      {/* 10 Sunner nhận quà mới nhất — per Figma D7 (only leaderboard) */}
      <SidebarLeaderboard
        title="10 Sunner Nhận Quà Mới Nhất"
        entries={giftLeaderboard}
        showPrize
      />
    </aside>
  )
}
