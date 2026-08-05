import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardSpotlight } from './board-spotlight'
import type { SpotlightNode } from './board-types'

const NODES: SpotlightNode[] = [
  { receiverId: 'u1', name: 'Alice Nguyen', avatar: null, kudoCount: 10 },
  { receiverId: 'u2', name: 'Bob Tran', avatar: null, kudoCount: 6 },
  { receiverId: 'u3', name: 'Carol Le', avatar: null, kudoCount: 4 },
]

const NOOP = vi.fn()

describe('BoardSpotlight', () => {
  it('renders total kudos count', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={388} onOpenProfile={NOOP} />)
    expect(screen.getByText(/388/)).toBeInTheDocument()
  })

  it('renders each node as a button with aria-label', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    expect(
      screen.getByRole('button', { name: /Alice Nguyen.*10 kudos/i }),
    ).toBeInTheDocument()
  })

  it('calls onOpenProfile when bubble is clicked', () => {
    const onOpenProfile = vi.fn()
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={onOpenProfile} />)
    fireEvent.click(screen.getByRole('button', { name: /Bob Tran/i }))
    expect(onOpenProfile).toHaveBeenCalledWith('u2')
  })

  it('renders all nodes as word-cloud buttons (no search filter per Figma V3)', () => {
    // Search bar removed in redesign — spotlight shows all nodes in the cloud.
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    expect(screen.getByRole('button', { name: /Alice Nguyen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bob Tran/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Carol Le/i })).toBeInTheDocument()
  })

  it('renders activity log entries when provided', () => {
    const activityLog = [
      { time: '09:01', name: 'Alice Nguyen' },
      { time: '09:15', name: 'Bob Tran' },
    ]
    render(
      <BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} activityLog={activityLog} />,
    )
    expect(screen.getByText(/09:01/)).toBeInTheDocument()
    expect(screen.getByText(/09:15/)).toBeInTheDocument()
  })

  it('expand toggle changes aria-pressed state', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    const toggle = screen.getByRole('button', { name: /mở rộng spotlight/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(
      screen.getByRole('button', { name: /thu gọn spotlight/i }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows empty state when nodes is empty', () => {
    render(<BoardSpotlight nodes={[]} totalKudos={0} onOpenProfile={NOOP} />)
    expect(screen.getByText(/chưa có dữ liệu/i)).toBeInTheDocument()
  })

  // ── V4 word-cloud rework ─────────────────────────────────────────────────────

  it('renders node names as text (word-cloud), not as avatar initials only', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    // Full name visible as button text (word-cloud style)
    const btn = screen.getByRole('button', { name: /Alice Nguyen.*10 kudos/i })
    expect(btn).toHaveTextContent('Alice Nguyen')
  })

  it('word-cloud buttons have title tooltip with name and kudo count', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    const btn = screen.getByRole('button', { name: /Alice Nguyen.*10 kudos/i })
    expect(btn).toHaveAttribute('title', expect.stringContaining('Alice Nguyen'))
    expect(btn).toHaveAttribute('title', expect.stringContaining('10'))
  })
})
