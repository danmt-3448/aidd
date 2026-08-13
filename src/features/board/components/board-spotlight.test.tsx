import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardSpotlight } from './board-spotlight'
import type { SpotlightNode } from './board-types'

// react-zoom-pan-pinch uses browser APIs; stub lightly so JSDOM doesn't crash
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TransformComponent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

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

  it('calls onOpenProfile when node clicked and onOpenKudoDetail not provided', () => {
    const onOpenProfile = vi.fn()
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={onOpenProfile} />)
    fireEvent.click(screen.getByRole('button', { name: /Bob Tran/i }))
    expect(onOpenProfile).toHaveBeenCalledWith('u2')
  })

  it('calls onOpenKudoDetail when node clicked and callback provided', () => {
    const onOpenProfile = vi.fn()
    const onOpenKudoDetail = vi.fn()
    render(
      <BoardSpotlight
        nodes={NODES}
        totalKudos={20}
        onOpenProfile={onOpenProfile}
        onOpenKudoDetail={onOpenKudoDetail}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Bob Tran/i }))
    expect(onOpenKudoDetail).toHaveBeenCalledWith('u2')
    expect(onOpenProfile).not.toHaveBeenCalled()
  })

  it('renders all nodes as word-cloud buttons', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    expect(screen.getByRole('button', { name: /Alice Nguyen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bob Tran/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Carol Le/i })).toBeInTheDocument()
  })

  it('renders activity log entries when provided (up to 6)', () => {
    const activityLog = [
      { receiverId: 'u1', time: '09:01', name: 'Alice Nguyen' },
      { receiverId: 'u2', time: '09:15', name: 'Bob Tran' },
    ]
    render(
      <BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} activityLog={activityLog} />,
    )
    expect(screen.getByText(/09:01/)).toBeInTheDocument()
    expect(screen.getByText(/09:15/)).toBeInTheDocument()
  })

  it('shows empty state when nodes is empty and not loading', () => {
    render(<BoardSpotlight nodes={[]} totalKudos={0} onOpenProfile={NOOP} />)
    expect(screen.getByText(/chưa có dữ liệu/i)).toBeInTheDocument()
  })

  it('shows loading spinner when isLoading=true', () => {
    render(<BoardSpotlight nodes={[]} totalKudos={0} onOpenProfile={NOOP} isLoading />)
    expect(screen.getByRole('status', { name: /đang tải/i })).toBeInTheDocument()
  })

  it('renders search input with placeholder "Tìm kiếm"', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    // Input has role="combobox" (ARIA pattern for search with dropdown suggestions)
    expect(
      screen.getByRole('combobox', { name: /tìm kiếm sunner/i }),
    ).toBeInTheDocument()
  })

  it('calls onSearchChange when search input changes', () => {
    const onSearchChange = vi.fn()
    render(
      <BoardSpotlight
        nodes={NODES}
        totalKudos={20}
        onOpenProfile={NOOP}
        search=""
        onSearchChange={onSearchChange}
      />,
    )
    // Input has role="combobox" (ARIA pattern for search with dropdown suggestions)
    const input = screen.getByRole('combobox', { name: /tìm kiếm sunner/i })
    fireEvent.change(input, { target: { value: 'Alice' } })
    expect(onSearchChange).toHaveBeenCalledWith('Alice')
  })

  it('renders pan/zoom reset button', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    expect(
      screen.getByRole('button', { name: /đặt lại pan\/zoom/i }),
    ).toBeInTheDocument()
  })

  it('word-cloud buttons have aria-label with name and kudo count', () => {
    render(<BoardSpotlight nodes={NODES} totalKudos={20} onOpenProfile={NOOP} />)
    const btn = screen.getByRole('button', { name: /Alice Nguyen.*10 kudos/i })
    expect(btn).toHaveTextContent('Alice Nguyen')
  })
})
