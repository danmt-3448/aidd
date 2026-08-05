import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardFeedCard } from './board-feed-card'
import type { FeedCardProps } from './board-types'

const BASE_CARD: FeedCardProps = {
  id: 'kudo-1',
  senderId: 'sender-uuid-1',
  senderName: 'Alice',
  senderAvatarUrl: null,
  receiverId: 'receiver-uuid-1',
  receiverName: 'Bob',
  receiverAvatarUrl: null,
  contentHtml: '<p>Thank you!</p>',
  heartCount: 5,
  likedByMe: false,
  createdAt: '2026-08-04T08:00:00Z',
  hashtags: ['#ThanhOm'],
}

describe('BoardFeedCard', () => {
  it('renders sender and receiver names', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders content HTML', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('Thank you!')).toBeInTheDocument()
  })

  it('renders hashtag chip', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('#ThanhOm')).toBeInTheDocument()
  })

  it('shows heart count from props', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders likedByMe=false as "Thích" aria-label', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        likedByMe={false}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /thích/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /thích/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders likedByMe=true as "Bỏ thích" aria-label', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        likedByMe={true}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /bỏ thích/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bỏ thích/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggleHeart with kudo id when heart button clicked', () => {
    const onToggleHeart = vi.fn()
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={onToggleHeart}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /thích/i }))
    expect(onToggleHeart).toHaveBeenCalledWith('kudo-1')
  })

  it('reflects updated heartCount when props change (no local state)', () => {
    // H-3: card renders from props; count changes are prop-driven (TanStack Query).
    const { rerender } = render(
      <BoardFeedCard
        {...BASE_CARD}
        heartCount={5}
        likedByMe={false}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('5')).toBeInTheDocument()

    rerender(
      <BoardFeedCard
        {...BASE_CARD}
        heartCount={6}
        likedByMe={true}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bỏ thích/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onCopyLink when copy button is clicked', () => {
    const onCopyLink = vi.fn()
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={onCopyLink}
        onOpenProfile={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /sao chép/i }))
    expect(onCopyLink).toHaveBeenCalledWith('kudo-1')
  })

  it('calls onOpenProfile with receiverId when "Xem chi tiết" is clicked', () => {
    // H-1: "Xem chi tiết" navigates to the receiver's profile.
    const onOpenProfile = vi.fn()
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={onOpenProfile}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /xem chi tiết/i }))
    expect(onOpenProfile).toHaveBeenCalledWith('receiver-uuid-1')
  })

  it('calls onOpenProfile with senderId when sender name/avatar is clicked', () => {
    // H-1: sender click navigates to sender's profile.
    const onOpenProfile = vi.fn()
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={onOpenProfile}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /xem profile alice/i }))
    expect(onOpenProfile).toHaveBeenCalledWith('sender-uuid-1')
  })

  it('calls onOpenProfile with receiverId when receiver name/avatar is clicked', () => {
    // H-1: receiver click navigates to receiver's profile.
    const onOpenProfile = vi.fn()
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={onOpenProfile}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /xem profile bob/i }))
    expect(onOpenProfile).toHaveBeenCalledWith('receiver-uuid-1')
  })

  it('renders sender as non-interactive div when senderId is null (anonymous)', () => {
    // H-1: anonymous kudos have no sender profile to navigate to.
    render(
      <BoardFeedCard
        {...BASE_CARD}
        senderId={null}
        senderName="Ẩn danh"
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    // No button with sender aria-label
    expect(screen.queryByRole('button', { name: /xem profile ẩn danh/i })).not.toBeInTheDocument()
    // Sender name still visible
    expect(screen.getByText('Ẩn danh')).toBeInTheDocument()
  })

  it('sender name span has truncate class for responsive overflow (@375 fix)', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        senderName="Nguyễn Văn Rất Dài Tên"
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    // The span wrapping the sender name must have the truncate class so long
    // names do not wrap to multiple lines at narrow viewports.
    const senderSpan = screen.getByText('Nguyễn Văn Rất Dài Tên')
    expect(senderSpan).toHaveClass('truncate')
  })

  it('receiver name span has truncate class for responsive overflow (@375 fix)', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        receiverName="Trần Thị Bình"
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    // The span wrapping the receiver name must truncate at narrow viewports
    // to prevent the sender → arrow → receiver row from breaking.
    const receiverSpan = screen.getByText('Trần Thị Bình')
    expect(receiverSpan).toHaveClass('truncate')
  })

  it('renders empty state when hashtags array is empty', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        hashtags={[]}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    // No hashtag chips visible
    expect(screen.queryByText('#ThanhOm')).not.toBeInTheDocument()
  })

  // ── Extended fields (V2 rework) ─────────────────────────────────────────────

  it('renders kudoTitle when provided', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        kudoTitle="IDOL GIỚI TRẺ"
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('IDOL GIỚI TRẺ')).toBeInTheDocument()
  })

  it('does not render kudoTitle section when not provided', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.queryByText('IDOL GIỚI TRẺ')).not.toBeInTheDocument()
  })

  it('renders senderDepartment below sender name', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        senderDepartment="CEVC10"
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('CEVC10')).toBeInTheDocument()
  })

  it('renders receiverDepartment below receiver name', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        senderDepartment="CEVC10"
        receiverDepartment="CEDN01"
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByText('CEDN01')).toBeInTheDocument()
  })

  it('renders tier badge when senderTier is provided', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        senderTier={2}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Tier: Rising Hero/i)).toBeInTheDocument()
  })

  it('renders tier badge when receiverTier is provided', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        receiverTier={3}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Tier: Legend Hero/i)).toBeInTheDocument()
  })

  it('does not render image gallery when imageUrls is empty', () => {
    const { container } = render(
      <BoardFeedCard
        {...BASE_CARD}
        imageUrls={[]}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(container.querySelector('[aria-label="Ảnh đính kèm"]')).not.toBeInTheDocument()
  })

  it('does not render image gallery when imageUrls is omitted', () => {
    const { container } = render(
      <BoardFeedCard
        {...BASE_CARD}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    expect(container.querySelector('[aria-label="Ảnh đính kèm"]')).not.toBeInTheDocument()
  })

  it('truncates hashtags beyond 5 and shows overflow badge', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        hashtags={['#A', '#B', '#C', '#D', '#E', '#F', '#G']}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    // First 5 shown
    expect(screen.getByText('#A')).toBeInTheDocument()
    expect(screen.getByText('#E')).toBeInTheDocument()
    // 6th and 7th hidden; overflow badge "+2" shown
    expect(screen.queryByText('#F')).not.toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('heart count renders formatted with locale separator for large numbers', () => {
    render(
      <BoardFeedCard
        {...BASE_CARD}
        heartCount={1000}
        onToggleHeart={vi.fn()}
        onCopyLink={vi.fn()}
        onOpenProfile={vi.fn()}
      />,
    )
    // vi-VN locale formats 1000 as "1.000"
    expect(screen.getByText('1.000')).toBeInTheDocument()
  })
})
