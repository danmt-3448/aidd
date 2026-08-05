/**
 * board-sidebar.test.tsx
 *
 * Rework pass 2 (D7): rankingLeaderboard removed from BoardSidebar per Figma.
 * Sidebar now shows ONLY stats + gift leaderboard ("10 Sunner Nhận Quà Mới Nhất").
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardSidebar } from './board-sidebar'
import type { BoardUserStats, LeaderboardEntry } from './board-types'

const STATS: BoardUserStats = {
  kudosReceived: 12,
  kudosSent: 8,
  heartsReceived: 47,
  secretBoxCount: 3,
}

function makeEntries(count: number, withPrize = false): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    id: `u${i + 1}`,
    name: `User ${i + 1}`,
    avatarUrl: null,
    score: 50 - i * 4,
    prize: withPrize ? `Prize ${i + 1}` : undefined,
  }))
}

describe('BoardSidebar', () => {
  it('renders all stats values', () => {
    render(
      <BoardSidebar
        stats={STATS}
        giftLeaderboard={[]}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/12 Số Kudos bạn nhận được/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/8 Số Kudos bạn đã gửi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/47 Số tim bạn nhận được/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/3 Số Secret Box bạn đã mở/i)).toBeInTheDocument()
  })

  it('calls onOpenSecretBox when "Mở quà" is clicked', () => {
    const onOpenSecretBox = vi.fn()
    render(
      <BoardSidebar
        stats={STATS}
        giftLeaderboard={[]}
        onOpenSecretBox={onOpenSecretBox}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /mở quà/i }))
    expect(onOpenSecretBox).toHaveBeenCalledOnce()
  })

  it('renders gift leaderboard entries', () => {
    const entries = makeEntries(3)
    render(
      <BoardSidebar
        stats={STATS}
        giftLeaderboard={entries}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.getByText('User 3')).toBeInTheDocument()
  })

  it('shows empty state when gift leaderboard is empty', () => {
    render(
      <BoardSidebar
        stats={STATS}
        giftLeaderboard={[]}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByText(/chưa có dữ liệu/i)).toBeInTheDocument()
  })

  it('renders prize description for gift leaderboard entries', () => {
    const entries: LeaderboardEntry[] = [
      { rank: 1, id: 'g1', name: 'Ngô Thị Mai', avatarUrl: null, score: 50, prize: 'Nhận được 1 áo phông SAA' },
      { rank: 2, id: 'g2', name: 'Cao Xuân Bách', avatarUrl: null, score: 46, prize: 'Nhận được 1 ly giữ nhiệt Sun*' },
    ]
    render(
      <BoardSidebar
        stats={STATS}
        giftLeaderboard={entries}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByText('Nhận được 1 áo phông SAA')).toBeInTheDocument()
    expect(screen.getByText('Nhận được 1 ly giữ nhiệt Sun*')).toBeInTheDocument()
  })

  it('renders top-3 rank badges in gift leaderboard', () => {
    const entries = makeEntries(5)
    render(
      <BoardSidebar
        stats={STATS}
        giftLeaderboard={entries}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Hạng 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Hạng 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Hạng 3')).toBeInTheDocument()
  })
})
