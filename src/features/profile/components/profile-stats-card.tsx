'use client'

/**
 * profile-stats-card.tsx — SELF-mode statistics panel.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb:
 *   Card bg: rgba(255,255,255,0.03), border: 1px solid rgba(255,255,255,0.08), radius 12px, padding 20px
 *   Label: Montserrat 700, 11px, rgba(255,255,255,0.5), UPPERCASE, tracking 1.5px
 *   Value: Montserrat 700, 28px, #FFEA9E, lineHeight 34px
 *   Divider: 1px solid rgba(255,255,255,0.06)
 *   "Mở quà" button: disabled state — bg rgba(255,255,255,0.08), color rgba(255,255,255,0.3)
 *
 * Rows:
 *   1. Kudos nhận      (received)
 *   2. Kudos đã gửi   (sent — hidden row when sent === null, but SELF always has sent)
 *   3. Hearts nhận    (hearts)
 *   ── divider ──
 *   4. Quà đã mở      (boxesOpened)
 *   5. Quà chưa mở   (boxesRemaining)  + disabled "Mở quà" button
 *
 * "Mở quà" is always disabled in this release (clarification 2026-08-03:
 * badge/box unlock logic deferred; show 0 + disabled button).
 */

import { montserrat } from '@/features/auth/fonts'
import type { ProfileStatsProps } from './profile-types'

// ── Stat row atom ────────────────────────────────────────────────────────────

interface StatRowProps {
  label: string
  value: number
}

function StatRow({ label, value }: StatRowProps) {
  return (
    /* mm:stat-row */
    <div className="flex items-center justify-between">
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          lineHeight: '16px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 28,
          color: '#FFEA9E',
          lineHeight: '34px',
        }}
        aria-label={`${value} ${label}`}
      >
        {value.toLocaleString('vi-VN')}
      </span>
    </div>
  )
}

// ── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    /* mm:stats-divider */
    <div
      aria-hidden
      style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}
    />
  )
}

// ── ProfileStatsCard ─────────────────────────────────────────────────────────

export interface ProfileStatsCardProps {
  stats: ProfileStatsProps
}

export function ProfileStatsCard({ stats }: ProfileStatsCardProps) {
  const { received, sent, hearts, boxesOpened, boxesRemaining } = stats

  return (
    /* mm:profile-stats-card */
    <section
      aria-label="Thống kê của tôi"
      className="flex flex-col gap-4 px-6 py-5"
    >
      <div
        className="flex flex-col gap-3"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        {/* Row 1: Kudos nhận */}
        <StatRow label="Kudos nhận" value={received} />

        {/* Row 2: Kudos đã gửi — present for SELF; null guard in case data arrives late */}
        {sent !== null && <StatRow label="Kudos đã gửi" value={sent} />}

        {/* Row 3: Hearts nhận */}
        <StatRow label="Hearts nhận" value={hearts} />

        {/* Divider between kudos stats and secret-box stats */}
        <Divider />

        {/* Row 4: Quà đã mở */}
        <StatRow label="Quà đã mở" value={boxesOpened} />

        {/* Row 5: Quà chưa mở + disabled Mở quà button */}
        {/* mm:secret-box-row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                lineHeight: '16px',
              }}
            >
              Quà chưa mở
            </span>
            <span
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize: 28,
                color: '#FFEA9E',
                lineHeight: '34px',
              }}
              aria-label={`${boxesRemaining} Quà chưa mở`}
            >
              {boxesRemaining.toLocaleString('vi-VN')}
            </span>
          </div>

          {/* "Mở quà" — always disabled per clarification (box-open UI is Secret Box screen) */}
          {/* mm:open-gift-btn */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Mở quà — không khả dụng"
            className="rounded-lg font-bold"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: montserrat.style.fontFamily,
              fontSize: 13,
              fontWeight: 700,
              padding: '8px 16px',
              cursor: 'not-allowed',
              flexShrink: 0,
            }}
          >
            Mở quà
          </button>
        </div>
      </div>
    </section>
  )
}
