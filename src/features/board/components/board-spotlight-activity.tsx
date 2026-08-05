'use client'

/**
 * board-spotlight-activity.tsx — Activity log for the Spotlight box.
 * Shows up to 6 recent kudo activity lines (Figma mms_B.7, bottom-left).
 */

import { montserrat } from '@/features/auth/fonts'
import type { SpotlightActivityEntry } from './board-types'

interface ActivityLogProps {
  entries: SpotlightActivityEntry[]
}

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) return null
  const visible = entries.slice(0, 6)
  return (
    <div className="flex flex-col gap-1" aria-label="Hoạt động gần đây">
      {visible.map((entry, i) => (
        <p
          key={i}
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ color: 'rgba(255,234,158,0.7)', fontWeight: 600 }}>{entry.time}</span>
          {' '}
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{entry.name}</span>
          {' '}đã nhận được một Kudos mới
        </p>
      ))}
    </div>
  )
}
