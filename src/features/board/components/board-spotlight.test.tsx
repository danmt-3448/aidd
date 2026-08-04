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

  it('filters nodes by search query', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'alice' } })
    expect(screen.getByRole('button', { name: /Alice Nguyen/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Bob Tran/i })).not.toBeInTheDocument()
  })

  it('shows not-found message when search yields no results', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz123' } })
    expect(screen.getByText(/không tìm thấy/i)).toBeInTheDocument()
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
})
