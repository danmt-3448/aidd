'use client'

/**
 * profile-stats-card.tsx — SELF-mode statistics panel.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb (get_node verified):
 *   Section (362:5073): width 680px, height 437px, gap 24px
 *   Card (362:5074): bg #00070C, border 1px solid #998C5F, borderRadius 17px, padding 40px, gap 10px
 *   Label (I362:5076;256:6735): Montserrat 700, 22px, rgba(255,255,255,1), lineHeight 28px
 *   Value (I362:5076;256:6753): Montserrat 700, 32px, rgba(255,234,158,1), lineHeight 40px
 *   Divider (362:5079): horizontal separator
 *   "Mở quà" button: disabled state per clarification (box-open UI is Secret Box screen)
 *
 * Rows:
 *   1. Số Kudos bạn nhận được:    (received)
 *   2. Số Kudos bạn đã gửi:      (sent — hidden when sent === null)
 *   3. Số tim bạn nhận được:     (hearts)
 *   ── divider ──
 *   4. Số box đã mở:             (boxesOpened)
 *   5. Số box chưa mở:          (boxesRemaining) + disabled "Mở quà" button
 */

import { montserrat } from '@/features/auth/fonts'
import type { ProfileStatsProps } from './profile-types'

// ── Stat row — label left / value right ──────────────────────────────────────

interface StatRowProps {
  label: string
  value: number
  /** nodeId for data-fig on the label element */
  labelNodeId?: string
  /** nodeId for data-fig on the value element */
  valueNodeId?: string
}

function StatRow({ label, value, labelNodeId, valueNodeId }: StatRowProps) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 8 }}>
      <span
        {...(labelNodeId ? { 'data-fig': labelNodeId } : {})}
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 22,
          color: 'rgba(255,255,255,1)',
          lineHeight: '28px',
        }}
      >
        {label}
      </span>
      <span
        {...(valueNodeId ? { 'data-fig': valueNodeId } : {})}
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 32,
          color: 'rgba(255,234,158,1)',
          lineHeight: '40px',
          flexShrink: 0,
        }}
        aria-label={`${value} ${label}`}
      >
        {value.toLocaleString('vi-VN')}
      </span>
    </div>
  )
}

// ── Divider — 362:5079 ───────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, background: '#998C5F', opacity: 0.3, margin: '4px 0' }}
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
    /* mm:profile-stats-card — mms_B_Thống kê 362:5073: flex column, gap 24px, px 24px, py 24px */
    <section
      data-fig="362:5073"
      aria-label="Thống kê của tôi"
      className="flex w-full flex-col px-6 py-6"
      style={{ rowGap: 24 }}
    >
      {/* 362:5074 — Thống kê card: bg #00070C, border #998C5F, radius 17px, padding 40px */}
      <div
        className="flex flex-col"
        style={{
          background: '#00070C',
          border: '1px solid #998C5F',
          borderRadius: 17,
          padding: 40,
          gap: 10,
        }}
      >
        {/* Row 1: Số Kudos bạn nhận được */}
        <StatRow
          label="Số Kudos bạn nhận được:"
          value={received}
          labelNodeId="I362:5076;256:6735"
          valueNodeId="I362:5076;256:6753"
        />

        {/* Row 2: Số Kudos bạn đã gửi — SELF only */}
        {sent !== null && (
          <StatRow
            label="Số Kudos bạn đã gửi:"
            value={sent}
            labelNodeId="I362:5077;256:6735"
            valueNodeId="I362:5077;256:6753"
          />
        )}

        {/* Row 3: Số tim bạn nhận được */}
        <StatRow
          label="Số tim bạn nhận được:"
          value={hearts}
          labelNodeId="I362:5078;256:6735"
          valueNodeId="I362:5078;256:6753"
        />

        {/* Divider — 362:5079 */}
        <Divider />

        {/* Row 4: Số box đã mở */}
        <StatRow
          label="Số box đã mở:"
          value={boxesOpened}
          labelNodeId="I362:5080;256:6735"
          valueNodeId="I362:5080;256:6753"
        />

        {/* Row 5: Số box chưa mở + disabled Mở quà button */}
        {/* mm:secret-box-row */}
        <div className="flex items-center justify-between" style={{ gap: 16 }}>
          <div className="flex flex-col" style={{ gap: 4 }}>
            <span
              data-fig="I362:5081;256:6735"
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize: 22,
                color: 'rgba(255,255,255,1)',
                lineHeight: '28px',
              }}
            >
              Số box chưa mở:
            </span>
            <span
              data-fig="I362:5081;256:6753"
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize: 32,
                color: 'rgba(255,234,158,1)',
                lineHeight: '40px',
              }}
              aria-label={`${boxesRemaining} Số box chưa mở`}
            >
              {boxesRemaining.toLocaleString('vi-VN')}
            </span>
          </div>

          {/* "Mở quà" button — always disabled (clarification: box-open UI is Secret Box screen) */}
          {/* mm:open-gift-btn — 362:5082 */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Mở quà — không khả dụng"
            className="rounded-lg font-bold"
            style={{
              background: 'rgba(255,234,158,0.15)',
              color: 'rgba(255,234,158,0.4)',
              fontFamily: montserrat.style.fontFamily,
              fontSize: 14,
              fontWeight: 700,
              padding: '10px 20px',
              cursor: 'not-allowed',
              flexShrink: 0,
              border: '1px solid rgba(255,234,158,0.2)',
              borderRadius: 8,
            }}
          >
            Mở quà
          </button>
        </div>
      </div>
    </section>
  )
}
