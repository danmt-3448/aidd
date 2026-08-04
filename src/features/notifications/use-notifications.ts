'use client'

import { useEffect } from 'react'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  getUnreadCount,
  listNotifications,
  type Notification,
  type NotificationCursor,
} from './notification-actions'

// ---------------------------------------------------------------------------
// Query keys — stable references so invalidation is consistent across the app.
// ---------------------------------------------------------------------------

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  list: (limit: number) => [...notificationKeys.all, 'list', limit] as const,
  infinite: () => [...notificationKeys.all, 'infinite'] as const,
}

// ---------------------------------------------------------------------------
// useUnreadCount
// ---------------------------------------------------------------------------

export interface UseUnreadCountReturn {
  count: number
  isLoading: boolean
  error: string | null
}

/**
 * Returns the caller's unread notification count and keeps it live via
 * Supabase Realtime. A new INSERT on `notifications` filtered to the current
 * user's `user_id` triggers an optimistic +1 increment and a background
 * query invalidation so the count stays accurate.
 *
 * Safe to mount when unauthenticated — count stays 0 and no subscription
 * is opened.
 */
export function useUnreadCount(uid: string | null): UseUnreadCountReturn {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const result = await getUnreadCount()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    // Poll not needed — Realtime handles live updates. staleTime keeps it
    // from refetching on every focus when there is no new push.
    staleTime: 30_000,
    enabled: uid !== null,
  })

  useEffect(() => {
    if (!uid) return

    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:unread:${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          // Optimistic increment so the badge reacts before the network round-trip.
          queryClient.setQueryData<number>(
            notificationKeys.unreadCount(),
            (prev) => (prev ?? 0) + 1,
          )
          // Background invalidation to reconcile any drift.
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.unreadCount(),
          })
          // Also invalidate the list so it refreshes when the panel opens.
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.all,
          })
        },
      )
      .on(
        'postgres_changes',
        {
          // UPDATE fires when markRead / markAllRead flips is_read to true.
          // Listening here keeps the badge accurate when another tab marks items
          // read — without this, the count would only drop on next page focus.
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          // Invalidate both count and list so they re-fetch from source of truth.
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.unreadCount(),
          })
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.all,
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [uid, queryClient])

  return {
    count: data ?? 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

// ---------------------------------------------------------------------------
// useNotificationList — panel-sized flat query (first N items, no pagination)
// ---------------------------------------------------------------------------

export interface UseNotificationListReturn {
  notifications: Notification[]
  isLoading: boolean
  error: string | null
}

/**
 * Returns the caller's recent notifications (newest first), capped at `limit`.
 * Intended for the bell popover panel. For the full /notifications page use
 * `useNotificationInfiniteList` instead.
 *
 * Pairs with useUnreadCount — both share the `notificationKeys.all` root so a
 * single `invalidateQueries({ queryKey: notificationKeys.all })` refreshes both.
 */
export function useNotificationList(
  uid: string | null,
  limit = 20,
): UseNotificationListReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: notificationKeys.list(limit),
    queryFn: async () => {
      const result = await listNotifications({ limit })
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 30_000,
    enabled: uid !== null,
  })

  return {
    notifications: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}

// ---------------------------------------------------------------------------
// useNotificationInfiniteList — keyset-paginated list for /notifications page
// ---------------------------------------------------------------------------

export interface UseNotificationInfiniteListReturn {
  notifications: Notification[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: string | null
  fetchNextPage: () => void
}

/**
 * Infinite keyset-paginated list for the full "Tất cả thông báo" screen.
 * Cursor shape: (created_at, id) — mirrors listBoardKudos pattern.
 */
export function useNotificationInfiniteList(
  uid: string | null,
  pageSize = 20,
): UseNotificationInfiniteListReturn {
  const query = useInfiniteQuery<
    { data: Notification[]; nextCursor: NotificationCursor | null },
    Error,
    { pages: { data: Notification[]; nextCursor: NotificationCursor | null }[] },
    ReturnType<typeof notificationKeys.infinite>,
    NotificationCursor | null
  >({
    queryKey: notificationKeys.infinite(),
    queryFn: async ({ pageParam }) => {
      const result = await listNotifications({
        limit: pageSize,
        cursor: pageParam ?? null,
      })
      if ('error' in result) throw new Error(result.error)
      return result
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    enabled: uid !== null,
  })

  const notifications = query.data?.pages.flatMap((p) => p.data) ?? []

  return {
    notifications,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    error: query.error?.message ?? null,
    fetchNextPage: () => { void query.fetchNextPage() },
  }
}
