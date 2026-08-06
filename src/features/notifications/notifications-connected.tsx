'use client'

/**
 * NotificationsConnected — client integration layer for /notifications.
 *
 * MoMorph frame: 6-1LRz3vqr ("Tất cả thông báo" full screen).
 * Brand tokens (MoMorph MCP unavailable — flagged for verify pass):
 *   - page bg: #00101A · card bg: rgba(255,255,255,0.03)
 *   - border: rgba(255,255,255,0.08) · unread dot: #FFEA9E
 */

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { montserrat } from '@/features/auth/fonts'
import { markRead, markAllRead } from './notification-actions'
import { notificationKeys, useUnreadCount, useNotificationInfiniteList } from './use-notifications'
import { NotificationRow } from './notification-row'
import type { Notification } from './notification-actions'

export interface NotificationsConnectedProps {
  uid: string | null
  user: { name: string; avatarUrl?: string } | null
  isAdmin: boolean
}

export function NotificationsConnected({ uid, user, isAdmin }: NotificationsConnectedProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const { count: unreadCount } = useUnreadCount(uid)
  const { notifications, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage } =
    useNotificationInfiniteList(uid, 20)

  useEffect(() => { if (error) toast.error(error) }, [error])

  // Infinite-scroll via IntersectionObserver.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleRowClick = useCallback(async (n: Notification) => {
    if (!n.is_read) {
      const res = await markRead(n.id)
      if ('ok' in res) void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      else toast.error(res.error)
    }
    if (n.link) router.push(n.link)
  }, [queryClient, router])

  const handleMarkAllRead = useCallback(async () => {
    const res = await markAllRead()
    if ('ok' in res) {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('Đã đánh dấu tất cả là đã đọc')
    } else {
      toast.error(res.error)
    }
  }, [queryClient])

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#00101A' }}>
      <SiteHeader user={user} unreadCount={unreadCount} uid={uid} isAdmin={isAdmin} activeNav={null} />

      {/* pt-24 (96px) clears the fixed 80px header — no top banner on this screen. */}
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-24 md:px-0">
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className={`${montserrat.className} text-2xl font-bold`} style={{ color: '#FFFFFF' }}>
            Tất cả thông báo
          </h1>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className={`${montserrat.className} text-sm font-semibold transition-opacity hover:opacity-70`}
              style={{ color: '#FFEA9E', background: 'transparent' }}
              aria-label="Đánh dấu tất cả đã đọc"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* List card */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          role="list"
          aria-label="Danh sách thông báo"
          aria-busy={isLoading}
        >
          {/* Loading skeleton */}
          {isLoading && notifications.length === 0 && (
            <div className="flex flex-col" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-4 py-4 md:px-6"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="mt-2 h-2.5 w-2.5 flex-shrink-0 animate-pulse rounded-full"
                    style={{ background: 'rgba(255,255,255,0.12)' }} />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 animate-pulse rounded"
                      style={{ width: '60%', background: 'rgba(255,255,255,0.1)' }} />
                    <div className="h-3 animate-pulse rounded"
                      style={{ width: '80%', background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20" aria-live="polite">
              <span style={{ fontSize: 40 }} aria-hidden="true">🔔</span>
              <p className={`${montserrat.className} text-base`} style={{ color: 'rgba(255,255,255,0.4)' }}>
                Chưa có thông báo nào
              </p>
            </div>
          )}

          {/* Rows */}
          {notifications.map((n) => (
            <div key={n.id} role="listitem">
              <NotificationRow notification={n} onClick={handleRowClick} />
            </div>
          ))}

          {/* Fetch-next spinner */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4" aria-live="polite" aria-label="Đang tải thêm…">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
            </div>
          )}
        </div>

        {/* Infinite-scroll sentinel */}
        <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
      </main>
    </div>
  )
}
