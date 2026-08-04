'use client'

/**
 * NotificationItem — single row rendered inside NotificationPanel (bell popover).
 * Presentational only; click handling delegated to parent via onClick prop.
 */

import { montserrat } from '@/features/auth/fonts'
import { formatRelativeTime } from './notification-time'
import type { Notification } from './notification-actions'

export interface NotificationItemProps {
  notification: Notification
  onClick: (n: Notification) => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { title, body, created_at, is_read } = notification

  return (
    <button
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
      style={{
        background: 'transparent',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
      onClick={() => onClick(notification)}
      aria-label={title ?? 'Thông báo'}
    >
      {/* Unread dot */}
      <span
        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
        style={{ background: is_read ? 'transparent' : '#FFEA9E' }}
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`${montserrat.className} line-clamp-2 text-sm font-semibold leading-snug`}
          style={{ color: is_read ? 'rgba(255,255,255,0.7)' : '#FFFFFF' }}
        >
          {title ?? 'Thông báo mới'}
        </span>

        {body && (
          <span
            className="line-clamp-2 text-xs leading-snug"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {body}
          </span>
        )}

        <span
          className="mt-0.5 text-xs"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {formatRelativeTime(created_at)}
        </span>
      </div>
    </button>
  )
}
