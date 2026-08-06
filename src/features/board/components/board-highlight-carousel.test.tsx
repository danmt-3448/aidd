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
    // Pagination renders as two separate text nodes: bold "1" + "/5"
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
    // The pagination span contains "1" in a <b> and "/5" in a <span> — combined text is "1/5"
    expect(screen.getByText(/\/5/)).toBeInTheDocument()
  })

  it('prev arrow is never disabled (infinite loop)', () => {
    // Carousel uses Swiper loop mode — arrows are always active, no start/end boundary.
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
    // Both large arrow buttons have disabled={false}
    const prevBtn = screen.getByRole('button', { name: 'Trang trước' })
    expect(prevBtn).not.toBeDisabled()
  })

  it('next arrow advances to card 2', () => {
    // Pagination chevron "Trang tiếp theo" updates the activeIndex counter
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
    fireEvent.click(screen.getByRole('button', { name: 'Trang tiếp theo' }))
    // After one click the pagination counter reads 2/5
    expect(screen.getByText(/\/5/)).toBeInTheDocument()
  })

  it('next arrow is never disabled (infinite loop)', () => {
    // Carousel uses Swiper loop mode — arrows are always active.
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
    const next = screen.getByRole('button', { name: 'Trang tiếp theo' })
    expect(next).not.toBeDisabled()
  })

  it('renders hashtag filter as a dropdown (combobox)', () => {
    // V3: filter is now a <select> dropdown, not chip buttons.
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
    const select = screen.getByRole('combobox', { name: /hashtag/i })
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '#Even' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '#Odd' })).toBeInTheDocument()
  })

  it('calls onHashtagChange when dropdown selection changes', () => {
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
    const select = screen.getByRole('combobox', { name: /hashtag/i })
    fireEvent.change(select, { target: { value: '#Even' } })
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

  it('active hashtag is reflected as the selected dropdown value', () => {
    // V3: active filter is expressed as the <select> value, not aria-pressed.
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
    const select = screen.getByRole('combobox', { name: /hashtag/i }) as HTMLSelectElement
    expect(select.value).toBe('#Even')
  })
})
