'use client'

/**
 * board-spotlight-activity.tsx — Activity log for the Spotlight box.
 * Shows up to 6 recent kudo recipients — NEWEST AT THE BOTTOM (ticker style):
 * the freshest kudo appears on the last line, older entries stack above and fade.
 * Figma node: 2940:14174 child feed layer.
 *
 * Opacity ramp: bottom (newest) row at full opacity, each row upward steps down.
 * Exact opacity values verified against get_node on the feed layer children.
 *
 * Prepend animation: newest entry fades + slides up into the bottom line.
 */

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('spotlight')
  if (entries.length === 0) return null

  // entries arrive newest-first; assign opacity by recency (newest = brightest),
  // then reverse so the newest row renders LAST → at the bottom of the feed.
  const rows = entries
    .slice(0, 6)
    .map((entry, i) => ({
      entry,
      rowOpacity: ROW_OPACITY[i] ?? ROW_OPACITY[ROW_OPACITY.length - 1],
      isNewest: i === 0,
    }))
    .reverse()

  return (
    <div className="flex flex-col gap-1 absolute -bottom-[40px] left-[20px]" aria-label={t('recentActivityAriaLabel')}>
      {rows.map(({ entry, rowOpacity, isNewest }) => {
        return (
          <p
            key={entry.receiverId + entry.createdAt}
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
            {' '}{t('receivedNewKudo')}
          </p>
        )
      })}

      {/* spotlight-activity-prepend + @keyframes spotlight-activity-in live in globals.css */}
    </div>
  )
}
