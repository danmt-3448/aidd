'use client'

/**
 * NotificationPanel — Radix-free popover triggered by the bell button.
 *
 * Design reference: MoMorph frame D_jgDqvIc8 (notification panel).
 * Brand tokens applied (MoMorph MCP unavailable — flagged for verify pass):
 *   - bg panel:   #0A1929 (dark navy variant)
 *   - border:     rgba(255,255,255,0.12)
 *   - unread dot: #FFEA9E (gold)
 *   - text primary: #FFFFFF / text secondary: rgba(255,255,255,0.6)
 *
 * Accessibility: role="dialog", aria-modal, Escape closes, click-outside closes.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { markRead, markAllRead } from './notification-actions'
import { notificationKeys, useNotificationList } from './use-notifications'
import { NotificationItem } from './notification-item'
import type { Notification } from './notification-actions'

export interface NotificationPanelProps {
  uid: string
  isOpen: boolean
  onClose: () => void
  /** Ref of the trigger button — used to exclude it from outside-click detection. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export function NotificationPanel({
  uid,
  isOpen,
  onClose,
  triggerRef,
}: NotificationPanelProps) {
  const t = useTranslations('notifications')
  const router = useRouter()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstFocusRef = useRef<HTMLButtonElement | null>(null)

  const { notifications, isLoading } = useNotificationList(uid, 10)

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Close on click outside (excludes the trigger button itself).
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose, triggerRef])

  // Focus first interactive element when panel opens.
  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => firstFocusRef.current?.focus())
  }, [isOpen])

  const handleItemClick = useCallback(async (n: Notification) => {
    if (!n.is_read) {
      const res = await markRead(n.id)
      if ('ok' in res) void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    }
    onClose()
    if (n.link) router.push(n.link)
  }, [queryClient, onClose, router])

  const handleMarkAllRead = useCallback(async () => {
    const res = await markAllRead()
    if ('ok' in res) void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  }, [queryClient])

  const handleViewAll = useCallback(() => {
    onClose()
    router.push('/notifications')
  }, [onClose, router])

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      data-fig="589:9152"
      role="dialog"
      aria-label={t('dialogLabel')}
      aria-modal="true"
      className="absolute right-0 z-50 flex flex-col overflow-hidden rounded-xl"
      style={{
        top: 'calc(100% + 8px)',
        width: 360,
        maxHeight: 480,
        background: '#0A1929',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Panel title — HELD: MoMorph has no node metadata for gWBVcaSVIf */}
        <h2 data-fig="589:9152-title" className={`${montserrat.className} text-sm font-bold`} style={{ color: '#FFFFFF' }}>
          {t('panelTitle')}
        </h2>
        <button
          ref={firstFocusRef}
          onClick={handleMarkAllRead}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: '#FFEA9E', background: 'transparent' }}
          aria-label={t('markAllReadLabel')}
        >
          {t('markAllRead')}
        </button>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
        role="list"
        aria-label={t('listLabel')}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
              style={{ borderTopColor: 'rgba(255,255,255,0.4)' }}
              aria-label={t('loading')}
            />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12" aria-live="polite">
            <span style={{ fontSize: 32 }} aria-hidden="true">🔔</span>
            <p className={`${montserrat.className} text-sm`} style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('emptyState')}
            </p>
          </div>
        )}

        {!isLoading && notifications.map((n) => (
          <div key={n.id} role="listitem">
            <NotificationItem notification={n} onClick={handleItemClick} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-center px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={handleViewAll}
          className={`${montserrat.className} w-full rounded py-2 text-sm font-semibold transition-opacity hover:opacity-80`}
          style={{ color: '#FFEA9E', background: 'transparent' }}
          aria-label={t('viewAllLabel')}
        >
          {t('viewAll')}
        </button>
      </div>
    </div>
  )
}
