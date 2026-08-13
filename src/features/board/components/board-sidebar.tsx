'use client'

/**
 * BoardSidebar — right-column panel with user stats + gift leaderboard.
 *
 * Design from MoMorph MCP screen MaZUn5xHXZ node 2940:13488 (D_Thống menu phải):
 *   The column itself is a bare flex container — NO bg/border/radius.
 *   D.1 (2940:13489) and D.3 (2940:13510) are separate self-bordered boxes.
 *   Gap between boxes: 24px (derived from position delta: startY 2959 − endY 2935 = 24).
 */

import { useTranslations } from 'next-intl'
import { StatsCard } from './board-sidebar-stats'
import { SidebarLeaderboard } from './board-sidebar-leaderboard'
import type { BoardUserStats, LeaderboardEntry } from './board-types'

export interface BoardSidebarProps {
  stats: BoardUserStats
  /** Top-10 gift recipients — D.3 leaderboard per Figma */
  giftLeaderboard: LeaderboardEntry[]
  onOpenSecretBox: () => void
}

export function BoardSidebar({
  stats,
  giftLeaderboard,
  onOpenSecretBox,
}: BoardSidebarProps) {
  const t = useTranslations('boardStats')

  return (
    <aside
      aria-label={t('ariaLabel')}
      className="flex flex-col"
      style={{ gap: 24 }}
    >
      {/* D.1 — Thống kê: 5 stat rows + Mở Secret Box button */}
      <StatsCard stats={stats} onOpenSecretBox={onOpenSecretBox} />

      {/* D.3 — 10 SUNNER NHẬN QUÀ MỚI NHẤT */}
      <SidebarLeaderboard entries={giftLeaderboard} />
    </aside>
  )
}
