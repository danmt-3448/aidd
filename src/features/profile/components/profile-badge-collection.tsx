'use client'

/**
 * profile-badge-collection.tsx — 6 greyed badge slots.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb:
 *   Section heading: Montserrat 700, 14px, rgba(255,255,255,0.5), uppercase, tracking 1.5px
 *   Slot: 48×48 circle, bg rgba(255,255,255,0.05), border 1px solid rgba(255,255,255,0.08)
 *   Lock icon: rgba(255,255,255,0.2)
 *
 * headingVariant:
 *   'self'  → "Bộ sưu tập icon của tôi"  (first-person, SELF mode)
 *   'other' → "Bộ sưu tập icon"           (neutral, OTHER mode)
 *
 * Badge unlock logic is deferred (clarification 2026-08-03).
 * All 6 slots are always greyed regardless of `badges` content.
 */

import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'

// ── Lock icon — inline SVG so color is controllable via CSS ─────────────────

function LockIcon() {
  return (
    /* mm:badge-lock-icon */
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color: 'rgba(255,255,255,0.2)' }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" fill="currentColor" />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ── Single greyed slot ───────────────────────────────────────────────────────

function BadgeSlot({ index, label }: { index: number; label: string }) {
  return (
    /* mm:badge-slot */
    <div
      aria-label={label}
      className="flex items-center justify-center rounded-full"
      style={{
        width: 48,
        height: 48,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      <LockIcon />
    </div>
  )
}

// ── ProfileBadgeCollection ───────────────────────────────────────────────────

export interface ProfileBadgeCollectionProps {
  /**
   * Controls the section heading copy.
   * 'self'  → first-person Vietnamese
   * 'other' → neutral Vietnamese
   */
  headingVariant: 'self' | 'other'
  /**
   * 6-slot array — passed from ProfileScreenProps.badges.
   * All values are null in this phase; presence of the prop keeps the
   * integration contract explicit for when unlock logic lands.
   */
  badges: readonly [null, null, null, null, null, null]
}

export function ProfileBadgeCollection({ headingVariant }: ProfileBadgeCollectionProps) {
  const t = useTranslations('profile')
  const heading =
    headingVariant === 'self' ? t('badges.headingSelf') : t('badges.headingOther')

  return (
    /* mm:profile-badge-collection */
    <section aria-label={heading} className="flex flex-col gap-3 px-6 py-5">
      {/* Section heading */}
      {/* mm:badge-collection-heading */}
      <p
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          lineHeight: '16px',
          margin: 0,
        }}
      >
        {heading}
      </p>

      {/* 6 greyed slots in a row */}
      {/* mm:badge-slots-row */}
      <div className="flex items-center gap-3" role="list" aria-label={t('badges.slotsRowLabel')}>
        {([0, 1, 2, 3, 4, 5] as const).map((i) => (
          <div key={i} role="listitem">
            <BadgeSlot index={i} label={t('badges.slotLabel', { number: i + 1 })} />
          </div>
        ))}
      </div>
    </section>
  )
}
