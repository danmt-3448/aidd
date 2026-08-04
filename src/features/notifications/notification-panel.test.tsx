/**
 * NotificationPanel unit tests.
 *
 * Coverage:
 *   - Empty state renders when no notifications
 *   - Loading spinner shown during fetch
 *   - Notification items render with title/body/time
 *   - Unread dot shown for unread; absent for read
 *   - "Xem tất cả" button calls onClose + navigates to /notifications
 *   - "Đánh dấu tất cả đã đọc" button calls markAllRead
 *   - Escape key closes panel
 *   - Click outside closes panel
 *   - role="dialog" + aria-modal present when open
 *   - Panel absent when isOpen=false
 */

import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationPanel } from './notification-panel'
import type { Notification } from './notification-actions'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// markRead / markAllRead — we test that they're called; return ok by default.
vi.mock('./notification-actions', () => ({
  markRead: vi.fn(async () => ({ ok: true })),
  markAllRead: vi.fn(async () => ({ ok: true })),
}))

// useNotificationList — controlled in tests via the mockReturn pattern.
const mockNotifications: Notification[] = []
let mockIsLoading = false

vi.mock('./use-notifications', () => ({
  useNotificationList: vi.fn(() => ({
    notifications: mockNotifications,
    isLoading: mockIsLoading,
    error: null,
  })),
  notificationKeys: {
    all: ['notifications'],
    unreadCount: () => ['notifications', 'unread-count'],
    list: (limit: number) => ['notifications', 'list', limit],
    infinite: () => ['notifications', 'infinite'],
  },
}))

// TanStack Query client
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

// next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    user_id: 'uid-1',
    type: 'kudo_received',
    title: 'Nguyễn Văn An đã gửi cho bạn một Kudo',
    body: 'Cảm ơn bạn đã làm việc tuyệt vời!',
    link: '/kudos/some-id',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 min ago
    ...overrides,
  }
}

function makeTriggerRef() {
  const el = document.createElement('button')
  document.body.appendChild(el)
  return { current: el }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading = false
    mockNotifications.length = 0
  })

  it('is not mounted when isOpen=false', () => {
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={false}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with role and aria-modal when open', () => {
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('shows loading spinner when isLoading=true and no items', () => {
    mockIsLoading = true
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    expect(screen.getByLabelText('Đang tải…')).toBeInTheDocument()
  })

  it('shows empty state when not loading and no notifications', () => {
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    expect(screen.getByText('Chưa có thông báo nào')).toBeInTheDocument()
  })

  it('renders notification items with title', () => {
    mockNotifications.push(makeNotification())
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    expect(
      screen.getByText('Nguyễn Văn An đã gửi cho bạn một Kudo')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Cảm ơn bạn đã làm việc tuyệt vời!')
    ).toBeInTheDocument()
  })

  it('shows unread dot for unread notification', () => {
    mockNotifications.push(makeNotification({ is_read: false }))
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    // The dot span has inline background set to '#FFEA9E' for unread.
    // happy-dom preserves the raw value; browsers may normalise to rgb().
    const dots = document.querySelectorAll('[aria-hidden="true"]')
    const unreadDot = Array.from(dots).find((el) => {
      const bg = (el as HTMLElement).style.background
      return bg === '#FFEA9E' || bg === 'rgb(255, 234, 158)'
    })
    expect(unreadDot).toBeTruthy()
  })

  it('shows transparent dot for read notification', () => {
    mockNotifications.push(makeNotification({ is_read: true }))
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )
    const dots = document.querySelectorAll('[aria-hidden="true"]')
    const readDot = Array.from(dots).find(
      (el) => (el as HTMLElement).style.background === 'transparent',
    )
    expect(readDot).toBeTruthy()
  })

  it('"Xem tất cả" calls onClose and navigates to /notifications', async () => {
    const onClose = vi.fn()
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={onClose}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )

    const viewAllBtn = screen.getByRole('button', { name: /xem tất cả/i })
    await userEvent.click(viewAllBtn)

    expect(onClose).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith('/notifications')
  })

  it('"Đánh dấu tất cả đã đọc" calls markAllRead and invalidates cache', async () => {
    const { markAllRead } = await import('./notification-actions')
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={vi.fn()}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )

    const markBtn = screen.getByRole('button', {
      name: /đánh dấu tất cả đã đọc/i,
    })
    await userEvent.click(markBtn)

    expect(markAllRead).toHaveBeenCalledOnce()
    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={onClose}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when clicking outside the panel', async () => {
    const onClose = vi.fn()
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={onClose}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )

    // Click directly on document.body (outside the panel and trigger).
    act(() => {
      fireEvent.mouseDown(document.body)
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does NOT call onClose when clicking the trigger button', async () => {
    const onClose = vi.fn()
    const triggerRef = makeTriggerRef()
    render(
      <NotificationPanel
        uid="uid-1"
        isOpen={true}
        onClose={onClose}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
      />
    )

    act(() => {
      fireEvent.mouseDown(triggerRef.current!)
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
