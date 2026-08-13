/**
 * feed-card-tier-badge.tsx — pill badge showing kudo sender/receiver tier level.
 *
 * Tier mapping (from spec kudo-card-tier-hover-spec-260811.md §1 — distinct senders):
 *   1 = New Hero    — 1–4 distinct senders   (coral/orange pill)
 *   2 = Rising Hero — 5–9 distinct senders   (amber pill)
 *   3 = Super Hero  — 10–20 distinct senders (orange/red pill)
 *   4 = Legend Hero — >20 distinct senders   (gold pill)
 *
 * Badge is a colored text pill with a custom tooltip on hover/focus.
 * Tooltip replaces the native `title` attr — accessible via aria-describedby.
 * Tooltip content: tier name + VERBATIM description from spec §1.
 */

'use client'

import { useState, useId, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'

interface FeedCardTierBadgeProps {
  tier: 1 | 2 | 3 | 4
  /**
   * When true the card background is light (cream #FFF8E1) — Legend Hero tier
   * color shifts from pale gold #FFEA9E to a darker amber so the pill is readable.
   */
  lightMode?: boolean
}

/** i18n key for each tier's tooltip description — looked up via useTranslations('board') */
const TIER_DESC_KEY: Record<1 | 2 | 3 | 4, string> = {
  1: 'tierNewHeroDesc',
  2: 'tierRisingHeroDesc',
  3: 'tierSuperHeroDesc',
  4: 'tierLegendHeroDesc',
}

const TIER_CONFIG: Record<
  1 | 2 | 3 | 4,
  { label: string; bg: string; color: string; border: string; colorLight: string; bgLight: string; borderLight: string }
> = {
  1: {
    label: 'New Hero',
    bg: 'rgba(231,57,40,0.15)',
    color: '#E73928',
    border: 'rgba(231,57,40,0.35)',
    colorLight: '#E73928',
    bgLight: 'rgba(231,57,40,0.12)',
    borderLight: 'rgba(231,57,40,0.30)',
  },
  2: {
    label: 'Rising Hero',
    bg: 'rgba(251,191,36,0.15)',
    color: '#F59E0B',
    border: 'rgba(251,191,36,0.35)',
    colorLight: '#D97706',
    bgLight: 'rgba(251,191,36,0.15)',
    borderLight: 'rgba(217,119,6,0.35)',
  },
  3: {
    // Tier 3 = Super Hero (10–20 distinct senders). Orange/red per Figma.
    label: 'Super Hero',
    bg: 'rgba(249,115,22,0.15)',
    color: '#F97316',
    border: 'rgba(249,115,22,0.35)',
    colorLight: '#C2410C',
    bgLight: 'rgba(249,115,22,0.12)',
    borderLight: 'rgba(194,65,12,0.30)',
  },
  4: {
    // Tier 4 = Legend Hero (>20 distinct senders). Gold/pale-gold per Figma.
    label: 'Legend Hero',
    bg: 'rgba(255,234,158,0.18)',
    color: '#FFEA9E',
    border: 'rgba(255,234,158,0.4)',
    colorLight: '#92400E',
    bgLight: 'rgba(255,234,158,0.35)',
    borderLight: 'rgba(146,64,14,0.35)',
  },
}

export function FeedCardTierBadge({ tier, lightMode = false }: FeedCardTierBadgeProps) {
  const t = useTranslations('board')
  const cfg = TIER_CONFIG[tier]
  const description = t(TIER_DESC_KEY[tier])
  const badgeColor = lightMode ? cfg.colorLight : cfg.color
  const badgeBg = lightMode ? cfg.bgLight : cfg.bg
  const badgeBorder = lightMode ? cfg.borderLight : cfg.border
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
        className="inline-flex flex-shrink-0 cursor-default items-center rounded-full px-2 py-0.5 font-bold"
        style={{
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          color: badgeColor,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.03em',
          lineHeight: '14px',
          whiteSpace: 'nowrap',
          fontFamily: montserrat.style.fontFamily,
        }}
        tabIndex={0}
        role="img"
        aria-label={`Tier: ${cfg.label}`}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        {cfg.label}
      </span>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg px-3 py-2 text-center shadow-lg"
          style={{
            background: 'rgba(30,26,46,0.96)',
            border: '1px solid rgba(255,234,158,0.2)',
            fontFamily: montserrat.style.fontFamily,
            width: 220,
            whiteSpace: 'normal',
          }}
        >
          <span
            className="block text-xs font-bold"
            style={{ color: cfg.color, letterSpacing: '0.03em' }}
            // Tooltip always uses dark-card color (tooltip bg is always dark navy)
          >
            {cfg.label}
          </span>
          <span
            className="mt-0.5 block text-xs leading-4"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {description}
          </span>
          {/* Arrow */}
          <span
            aria-hidden
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(30,26,46,0.96)',
            }}
          />
        </span>
      )}
    </span>
  )
}
