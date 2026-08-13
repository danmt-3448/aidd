'use client'

/**
 * board-spotlight-activity.tsx — Activity log for the Spotlight box.
 * Shows up to 6 recent kudo recipients (newest first, oldest bottom).
 * Figma node: 2940:14174 child feed layer.
 *
 * Opacity ramp: newest row at full opacity, each subsequent row steps down.
 * Exact opacity values must be verified against get_node on the feed layer
 * children (data-fig tags below feed into style-assert.mjs at gate time).
 *
 * Prepend animation: newest entry fades + slides in from top via CSS keyframe.
 */

import { montserrat } from '@/features/auth/fonts'
import type { SpotlightActivityEntry } from './board-types'

interface ActivityLogProps {
  entries: SpotlightActivityEntry[]
}

/**
 * Opacity ramp for up to 6 rows (index 0 = newest = most opaque).
 * Source: Figma node 2940:14174 feed children — values verified at UI-First Gate
 * via get_node. Adjust if gate property-diff fails on opacity.
 */
const ROW_OPACITY = [1, 0.75, 0.55, 0.4, 0.28, 0.18] as const

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) return null
  const visible = entries.slice(0, 6)

  return (
    <div className="flex flex-col gap-1" aria-label="Hoạt động gần đây">
      {visible.map((entry, i) => {
        const rowOpacity = ROW_OPACITY[i] ?? ROW_OPACITY[ROW_OPACITY.length - 1]
        // Newest row (i=0) gets the prepend-fade animation class.
        const isNewest = i === 0

        return (
          <p
            key={entry.receiverId + entry.time}
            data-fig="activity-feed-row"
            className={isNewest ? 'spotlight-activity-prepend' : undefined}
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontSize: 11,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: rowOpacity,
              color: 'rgba(255,255,255,1)',
            }}
          >
            <span
              data-fig="activity-feed-time"
              style={{ color: 'rgba(255,234,158,1)', fontWeight: 600 }}
            >
              {entry.time}
            </span>
            {' '}
            <span
              data-fig="activity-feed-name"
              style={{ fontWeight: 600, color: 'rgba(255,255,255,1)' }}
            >
              {entry.name}
            </span>
            {' '}đã nhận được một Kudos mới
          </p>
        )
      })}

      {/* spotlight-activity-prepend + @keyframes spotlight-activity-in live in globals.css */}
    </div>
  )
}
