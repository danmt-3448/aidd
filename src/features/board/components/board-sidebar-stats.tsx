'use client'

/**
 * board-sidebar-stats.tsx — stats rows + "Mở quà" button for the board sidebar.
 *
 * Design tokens from Figma node 2940:13489 (D.1_Thống kê tổng quat):
 *   Container: bg #00070C, border 1px solid #998C5F, border-radius 17px, padding 24px, gap 10px
 *   Stat row: height 32px, justify-between, align-center, gap 8px
 *   Label: Montserrat 600 14px rgba(255,255,255,1) line-height 20px — fits 1 line, no wrap
 *   Value: Montserrat 700 24px rgba(255,234,158,1) line-height 32px
 *   Divider (D.1.5): rgba(46,57,64,1) — dark teal
 *   x2 badge: Montserrat 700 12px white text with black stroke
 *   Button (D.1.8): bg rgba(255,234,158,1) h-48px border-radius 8px padding 16px centered
 *
 * Icons per row (Figma mms_D.1.2–D.1.7):
 *   D.1.2 kudos received  → Inbox  (white, 16px)
 *   D.1.3 kudos sent      → Send   (white, 16px)
 *   D.1.4 hearts          → Flame  (orange #FF6B35, 16px) + x2 badge
 *   D.1.6 secret box open → PackageOpen (white, 16px)
 *   D.1.7 secret box new  → Package    (white, 16px)
 *
 * secretBoxUnopened is optional — falls back to 0 until BE exposes the split field.
 * TRACKED: add secretBoxUnopened to BoardUserStats when BE splits the count.
 */

import { Inbox, Send, Flame, PackageOpen, Package } from 'lucide-react'
import { montserrat } from '@/features/auth/fonts'
import type { BoardUserStats } from './board-types'
import type { LucideIcon } from 'lucide-react'

interface StatRowProps {
  icon: LucideIcon
  iconColor?: string
  label: string
  value: number
  /** When true, renders the "x2" badge inline with the label */
  showX2Badge?: boolean
}

function StatRow({ icon: Icon, iconColor = 'rgba(255,255,255,0.85)', label, value, showX2Badge }: StatRowProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ gap: 8, minHeight: 32 }}
    >
      {/* Icon + Label + optional x2 badge — kept on 1 line via nowrap */}
      {/* mm:I2940:13491;256:6733 */}
      <span className="flex items-center gap-1.5 min-w-0">
        {/* mm:I2940:13491;256:6735 — icon left of label */}
        <Icon
          size={16}
          aria-hidden
          style={{ color: iconColor, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 600,
            fontSize: 14,
            color: 'rgba(255,255,255,1)',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        {showX2Badge && (
          <span
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              fontSize: 12,
              color: '#FFFFFF',
              WebkitTextStroke: '0.5px #000000',
              lineHeight: '16px',
              flexShrink: 0,
            }}
            aria-label="nhân 2"
          >
            x2
          </span>
        )}
      </span>

      {/* Value — gold number */}
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 24,
          color: 'rgba(255,234,158,1)',
          lineHeight: '32px',
          flexShrink: 0,
        }}
        aria-label={`${value} ${label}`}
      >
        {value.toLocaleString('vi-VN')}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{ height: 1, background: 'rgba(46,57,64,1)' }}
    />
  )
}

export interface StatsCardProps {
  stats: BoardUserStats
  onOpenSecretBox: () => void
}

export function StatsCard({ stats, onOpenSecretBox }: StatsCardProps) {
  return (
    /* mm:2940:13489 */
    <div
      className="flex flex-col"
      style={{
        background: '#00070C',
        border: '1px solid #998C5F',
        borderRadius: 17,
        padding: 24,
        gap: 10,
      }}
    >
      {/* mm:2940:13491 */}
      <StatRow
        icon={Inbox}
        label="Số Kudos bạn nhận được:"
        value={stats.kudosReceived}
      />
      <Divider />
      {/* mm:2940:13492 */}
      <StatRow
        icon={Send}
        label="Số Kudos bạn đã gửi:"
        value={stats.kudosSent}
      />
      <Divider />
      {/* mm:3241:14882 */}
      <StatRow
        icon={Flame}
        iconColor="#FF6B35"
        label="Số tim bạn nhận được:"
        value={stats.heartsReceived}
        showX2Badge
      />
      <Divider />
      {/* mm:2940:13495 */}
      <StatRow
        icon={PackageOpen}
        label="Số Secret Box bạn đã mở:"
        value={stats.secretBoxCount}
      />
      <Divider />
      {/* mm:2940:13496 */}
      <StatRow
        icon={Package}
        label="Số Secret Box chưa mở:"
        value={stats.secretBoxUnopened ?? 0}
      />

      {/* mm:2940:13497 */}
      <button
        type="button"
        onClick={onOpenSecretBox}
        className="w-full font-bold transition-opacity hover:opacity-90"
        style={{
          background: 'rgba(255,234,158,1)',
          color: '#00070C',
          fontFamily: montserrat.style.fontFamily,
          fontSize: 14,
          fontWeight: 700,
          height: 48,
          borderRadius: 8,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Mở Secret Box
      </button>
    </div>
  )
}
