import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BoardAllKudosFeed } from './board-all-kudos-feed'
import type { FeedCardProps } from './board-types'

const CARD: FeedCardProps = {
  id: 'k1',
  senderId: 'sender-uuid-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  receiverId: 'receiver-uuid-1',
  receiverName: 'Bob',
  receiverAvatarUrl: null,
  contentHtml: '<p>Great work!</p>',
  heartCount: 3,
  likedByMe: false,
  createdAt: '2026-08-04T08:00:00Z',
}

const NOOP = vi.fn()

describe('BoardAllKudosFeed', () => {
  it('renders empty state when no cards', () => {
    render(
      <BoardAllKudosFeed
        cards={[]}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByText(/chưa có Kudos nào/i)).toBeInTheDocument()
  })

  it('renders card list when cards provided', () => {
    const cards = [CARD, { ...CARD, id: 'k2', senderName: 'Carol', receiverName: 'Dave' }]
    render(
      <BoardAllKudosFeed
        cards={cards}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('does not show empty state when cards are present', () => {
    render(
      <BoardAllKudosFeed
        cards={[CARD]}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.queryByText(/chưa có Kudos nào/i)).not.toBeInTheDocument()
  })

  it('renders section label', () => {
    render(
      <BoardAllKudosFeed
        cards={[]}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByText(/all kudos/i)).toBeInTheDocument()
  })
})
