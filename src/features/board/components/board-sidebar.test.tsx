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

function makeEntries(count: number): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    id: `u${i + 1}`,
    name: `User ${i + 1}`,
    avatarUrl: null,
    score: 50 - i * 4,
  }))
}

describe('BoardSidebar', () => {
  it('renders all four stats values', () => {
    render(
      <BoardSidebar
        stats={STATS}
        rankingLeaderboard={[]}
        giftLeaderboard={[]}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/12 Kudos nhận/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/8 Kudos gửi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/47 Hearts/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/3 Secret Box/i)).toBeInTheDocument()
  })

  it('calls onOpenSecretBox when "Mở quà" is clicked', () => {
    const onOpenSecretBox = vi.fn()
    render(
      <BoardSidebar
        stats={STATS}
        rankingLeaderboard={[]}
        giftLeaderboard={[]}
        onOpenSecretBox={onOpenSecretBox}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /mở quà/i }))
    expect(onOpenSecretBox).toHaveBeenCalledOnce()
  })

  it('renders ranking leaderboard entries', () => {
    const entries = makeEntries(3)
    render(
      <BoardSidebar
        stats={STATS}
        rankingLeaderboard={entries}
        giftLeaderboard={[]}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.getByText('User 3')).toBeInTheDocument()
  })

  it('renders gift leaderboard entries', () => {
    const entries = makeEntries(2)
    render(
      <BoardSidebar
        stats={STATS}
        rankingLeaderboard={[]}
        giftLeaderboard={entries}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByText('User 2')).toBeInTheDocument()
  })

  it('shows empty state for ranking leaderboard when no entries', () => {
    render(
      <BoardSidebar
        stats={STATS}
        rankingLeaderboard={[]}
        giftLeaderboard={[]}
        onOpenSecretBox={vi.fn()}
      />,
    )
    // Both leaderboards empty → two "Chưa có dữ liệu." messages
    const msgs = screen.getAllByText(/chưa có dữ liệu/i)
    expect(msgs.length).toBeGreaterThanOrEqual(2)
  })

  it('top-3 rank labels are present', () => {
    const entries = makeEntries(5)
    render(
      <BoardSidebar
        stats={STATS}
        rankingLeaderboard={entries}
        giftLeaderboard={[]}
        onOpenSecretBox={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Hạng 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Hạng 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Hạng 3')).toBeInTheDocument()
  })
})
