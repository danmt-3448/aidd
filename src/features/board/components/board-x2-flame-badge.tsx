'use client'

/**
 * board-x2-flame-badge.tsx — "x2" text badge with hover tooltip for the sidebar hearts stat.
 *
 * Spec §4: shown when a special x2-hearts campaign day is active.
 * On hover/focus the badge reveals the campaign date range tooltip.
 *
 * Design tokens from Figma node 3241:14882 (D.1.4 — Flame stat row):
 *   x2 badge: Montserrat 700, 12px, white (#FFFFFF) with 0.5px black stroke.
 *   Tooltip bg: rgba(0,7,12,0.97), border rgba(255,234,158,0.2), width 260px.
 */

import { useState, useId, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'

export interface X2FlameBadgeProps {
  /** Full tooltip text — verbatim from spec §4 including campaign dates */
  tooltipText: string
}

export function X2FlameBadge({ tooltipText }: X2FlameBadgeProps) {
  const t = useTranslations('board')
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 80)
  }, [])

  return (
    <span
      className="relative inline-flex flex-shrink-0"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 12,
          color: '#FFFFFF',
          WebkitTextStroke: '0.5px #000000',
          lineHeight: '16px',
          cursor: 'default',
        }}
        aria-label={t('x2BadgeLabel')}
        aria-describedby={open ? tooltipId : undefined}
        tabIndex={0}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
      >
        x2
      </span>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg px-3 py-2 shadow-xl"
          style={{
            background: 'rgba(0,7,12,0.97)',
            border: '1px solid rgba(255,234,158,0.2)',
            fontFamily: montserrat.style.fontFamily,
            width: 260,
            whiteSpace: 'normal',
          }}
        >
          <span
            className="block text-xs leading-5"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {tooltipText}
          </span>
          <span
            aria-hidden
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(0,7,12,0.97)',
            }}
          />
        </span>
      )}
    </span>
  )
}
