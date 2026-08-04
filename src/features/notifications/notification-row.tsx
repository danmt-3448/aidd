'use client'

/**
 * NotificationRow — single row for the full /notifications screen.
 * Larger than NotificationItem (panel): shows 3-line body, bigger dot.
 * Presentational — click delegated to parent.
 */

import { montserrat } from '@/features/auth/fonts'
import { formatRelativeTime } from './notification-time'
import type { Notification } from './notification-actions'

export interface NotificationRowProps {
  notification: Notification
  onClick: (n: Notification) => void
}

export function NotificationRow({ notification, onClick }: NotificationRowProps) {
  const { title, body, created_at, is_read } = notification

  return (
    <button
      className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors md:px-6"
      style={{
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
      onClick={() => onClick(notification)}
      aria-label={title ?? 'Thông báo'}
    >
      {/* Unread indicator */}
      <span
        className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full"
        style={{ background: is_read ? 'transparent' : '#FFEA9E' }}
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`${montserrat.className} line-clamp-2 text-sm font-semibold leading-snug`}
          style={{ color: is_read ? 'rgba(255,255,255,0.65)' : '#FFFFFF' }}
        >
          {title ?? 'Thông báo mới'}
        </span>

        {body && (
          <span
            className="line-clamp-3 text-sm leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {body}
          </span>
        )}

        <span
          className="mt-0.5 text-xs"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {formatRelativeTime(created_at)}
        </span>
      </div>
    </button>
  )
}
