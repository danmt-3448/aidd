import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardHighlightCarousel } from './board-highlight-carousel'
import type { FeedCardProps } from './board-types'

function makeCard(n: number): FeedCardProps {
  return {
    id: `kudo-${n}`,
    senderId: `sender-uuid-${n}`,
    senderName: `Sender ${n}`,
    senderAvatarUrl: null,
    receiverId: `receiver-uuid-${n}`,
    receiverName: `Receiver ${n}`,
    receiverAvatarUrl: null,
    contentHtml: `<p>Content ${n}</p>`,
    heartCount: n,
    likedByMe: false,
    createdAt: '2026-08-04T08:00:00Z',
    hashtags: n % 2 === 0 ? ['#Even'] : ['#Odd'],
  }
}

const CARDS = [1, 2, 3, 4, 5].map(makeCard)
const HASHTAGS = ['#Even', '#Odd']
const NOOP = vi.fn()

describe('BoardHighlightCarousel', () => {
  it('renders the first card by default', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByText('Sender 1')).toBeInTheDocument()
  })

  it('shows pagination "1/5"', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })

  it('prev arrow is disabled at index 0', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByRole('button', { name: 'Kudo trước' })).toBeDisabled()
  })

  it('next arrow advances to card 2', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Kudo tiếp theo' }))
    expect(screen.getByText('2/5')).toBeInTheDocument()
    expect(screen.getByText('Sender 2')).toBeInTheDocument()
  })

  it('next arrow is disabled at last card', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    const next = screen.getByRole('button', { name: 'Kudo tiếp theo' })
    // Advance to end
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(next).toBeDisabled()
  })

  it('renders hashtag filter chips', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByRole('button', { name: '#Even' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '#Odd' })).toBeInTheDocument()
  })

  it('calls onHashtagChange when chip is clicked', () => {
    const onHashtagChange = vi.fn()
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag={null}
        onHashtagChange={onHashtagChange}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '#Even' }))
    expect(onHashtagChange).toHaveBeenCalledWith('#Even')
  })

  it('shows empty state when no cards', () => {
    render(
      <BoardHighlightCarousel
        cards={[]}
        hashtags={[]}
        activeHashtag={null}
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByText(/chưa có Kudos nào/i)).toBeInTheDocument()
  })

  it('active hashtag chip has aria-pressed true', () => {
    render(
      <BoardHighlightCarousel
        cards={CARDS}
        hashtags={HASHTAGS}
        activeHashtag="#Even"
        onHashtagChange={NOOP}
        onToggleHeart={NOOP}
        onCopyLink={NOOP}
        onOpenProfile={NOOP}
      />,
    )
    expect(screen.getByRole('button', { name: '#Even' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '#Odd' })).toHaveAttribute('aria-pressed', 'false')
  })
})
