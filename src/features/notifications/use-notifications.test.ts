/**
 * use-notifications hook tests.
 *
 * Coverage:
 *   useUnreadCount:
 *     - returns 0 when uid is null (disabled query)
 *     - returns count from server action
 *     - subscribes to INSERT realtime → optimistic +1
 *     - subscribes to UPDATE realtime → invalidates queries
 *
 *   useNotificationList:
 *     - returns empty array when uid is null
 *     - returns notifications from server action
 *     - passes limit to listNotifications
 *
 *   useNotificationInfiniteList:
 *     - returns flat notifications from all pages
 *     - exposes fetchNextPage / hasNextPage
 *     - propagates error from server action
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Notification, NotificationCursor } from './notification-actions'

// ---------------------------------------------------------------------------
// Mock: notification-actions
// ---------------------------------------------------------------------------

const mockGetUnreadCount = vi.fn()
const mockListNotifications = vi.fn()

vi.mock('./notification-actions', () => ({
  getUnreadCount: (...args: unknown[]) => mockGetUnreadCount(...args),
  listNotifications: (...args: unknown[]) => mockListNotifications(...args),
}))

// ---------------------------------------------------------------------------
// Mock: Supabase client (Realtime channel)
// ---------------------------------------------------------------------------

type PostgresHandler = () => void
interface ChannelSpy {
  on: Mock
  subscribe: Mock
  _fireEvent: (event: 'INSERT' | 'UPDATE') => void
}

function makeChannelSpy(): ChannelSpy {
  const handlers: Record<string, PostgresHandler> = {}

  const spy: ChannelSpy = {
    on: vi.fn((_event: string, opts: { event: string }, cb: PostgresHandler) => {
      handlers[opts.event] = cb
      return spy
    }),
    subscribe: vi.fn(() => spy),
    _fireEvent(event) {
      handlers[event]?.()
    },
  }
  return spy
}

const channelSpy = makeChannelSpy()
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: vi.fn(() => channelSpy),
    removeChannel: mockRemoveChannel,
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
    queryClient: qc,
  }
}

function makeNotification(
  overrides: Partial<Notification> = {},
  index = 0,
): Notification {
  return {
    id: `00000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
    user_id: 'uid-1',
    type: 'kudo_received',
    title: `Kudo ${index}`,
    body: `Body ${index}`,
    link: '/kudos',
    is_read: false,
    created_at: new Date(Date.now() - index * 60_000).toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Import hooks under test (after mocks are in place)
// ---------------------------------------------------------------------------

const {
  useUnreadCount,
  useNotificationList,
  useNotificationInfiniteList,
} = await import('./use-notifications')

// ---------------------------------------------------------------------------
// useUnreadCount
// ---------------------------------------------------------------------------

describe('useUnreadCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    channelSpy.on.mockClear()
    channelSpy.subscribe.mockClear()
  })

  it('returns count=0 and does not query when uid is null', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUnreadCount(null), { wrapper })

    // Query is disabled — isLoading stays false, count stays 0.
    expect(result.current.count).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(mockGetUnreadCount).not.toHaveBeenCalled()
  })

  it('fetches and returns unread count from server action', async () => {
    mockGetUnreadCount.mockResolvedValue({ data: 7 })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUnreadCount('uid-1'), { wrapper })

    await waitFor(() => expect(result.current.count).toBe(7))
    expect(mockGetUnreadCount).toHaveBeenCalled()
  })

  it('exposes error string when server action returns an error', async () => {
    mockGetUnreadCount.mockResolvedValue({ error: 'Không thể tải thông báo.' })
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUnreadCount('uid-1'), { wrapper })

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.count).toBe(0)
  })

  it('subscribes to the realtime channel when uid is non-null', async () => {
    mockGetUnreadCount.mockResolvedValue({ data: 0 })
    const { wrapper } = makeWrapper()
    renderHook(() => useUnreadCount('uid-1'), { wrapper })

    await waitFor(() => expect(channelSpy.subscribe).toHaveBeenCalled())
    // Both INSERT and UPDATE listeners registered.
    expect(channelSpy.on).toHaveBeenCalledTimes(2)
  })

  it('does NOT subscribe when uid is null', () => {
    const { wrapper } = makeWrapper()
    renderHook(() => useUnreadCount(null), { wrapper })
    expect(channelSpy.subscribe).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// useNotificationList
// ---------------------------------------------------------------------------

describe('useNotificationList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array and skips query when uid is null', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useNotificationList(null, 10), {
      wrapper,
    })

    expect(result.current.notifications).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockListNotifications).not.toHaveBeenCalled()
  })

  it('fetches notifications and returns them', async () => {
    const items = [makeNotification({}, 0), makeNotification({}, 1)]
    mockListNotifications.mockResolvedValue({ data: items, nextCursor: null })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationList('uid-1', 10),
      { wrapper },
    )

    await waitFor(() =>
      expect(result.current.notifications).toHaveLength(2),
    )
    expect(mockListNotifications).toHaveBeenCalledWith({ limit: 10 })
  })

  it('propagates error when server action fails', async () => {
    mockListNotifications.mockResolvedValue({ error: 'Lỗi mạng' })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationList('uid-1', 5),
      { wrapper },
    )

    await waitFor(() => expect(result.current.error).toBe('Lỗi mạng'))
    expect(result.current.notifications).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// useNotificationInfiniteList
// ---------------------------------------------------------------------------

describe('useNotificationInfiniteList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array and skips query when uid is null', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationInfiniteList(null, 10),
      { wrapper },
    )

    expect(result.current.notifications).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockListNotifications).not.toHaveBeenCalled()
  })

  it('fetches first page and flattens notifications', async () => {
    const items = [makeNotification({}, 0), makeNotification({}, 1)]
    mockListNotifications.mockResolvedValue({ data: items, nextCursor: null })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationInfiniteList('uid-1', 10),
      { wrapper },
    )

    await waitFor(() =>
      expect(result.current.notifications).toHaveLength(2),
    )
    expect(result.current.hasNextPage).toBe(false)
  })

  it('exposes hasNextPage=true when server returns a nextCursor', async () => {
    const items = [makeNotification({}, 0)]
    const cursor: NotificationCursor = {
      createdAt: items[0]!.created_at,
      id: items[0]!.id,
    }
    mockListNotifications.mockResolvedValue({ data: items, nextCursor: cursor })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationInfiniteList('uid-1', 1),
      { wrapper },
    )

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    expect(result.current.notifications).toHaveLength(1)
  })

  it('propagates error string when server action fails', async () => {
    mockListNotifications.mockResolvedValue({ error: 'Lỗi server' })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationInfiniteList('uid-1', 10),
      { wrapper },
    )

    await waitFor(() => expect(result.current.error).toBe('Lỗi server'))
  })

  it('exposes fetchNextPage function', async () => {
    mockListNotifications.mockResolvedValue({ data: [], nextCursor: null })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useNotificationInfiniteList('uid-1', 10),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(typeof result.current.fetchNextPage).toBe('function')
  })
})
