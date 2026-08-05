'use client'

/**
 * board-sidebar-stats.tsx — stats rows + "Mở quà" button for the board sidebar.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ (V5 rework):
 *   Layout: row-based (was grid) — label left, value right-aligned
 *   Label: Montserrat 400, 14px, rgba(255,255,255,0.7)
 *   Value: Montserrat 700, 14px, #FFEA9E
 *   Divider between stat groups: 1px solid rgba(255,255,255,0.1)
 *   "Mở quà" CTA: same gold pill as before
 *
 * BoardUserStats.secretBoxCount is split into "opened" vs "unopened" display
 * — Figma shows two rows for secret box:
 *   Row 4: "Số Secret Box bạn đã mở: 25"
 *   Row 5: "Số Secret Box chưa mở: 25"
 * The current interface exposes a single secretBoxCount. We display it under
 * "đã mở" and leave "chưa mở" as 0 until BE exposes the split field.
 * TRACKED: add secretBoxUnopened to BoardUserStats when BE splits the count.
 */

import { montserrat } from '@/features/auth/fonts'
import type { BoardUserStats } from './board-types'

interface StatRowProps {
  label: string
  value: number
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 400,
          fontSize: 14,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '20px',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 14,
          color: '#FFEA9E',
          lineHeight: '20px',
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
      style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}
    />
  )
}

export interface StatsCardProps {
  stats: BoardUserStats
  onOpenSecretBox: () => void
}

export function StatsCard({ stats, onOpenSecretBox }: StatsCardProps) {
  return (
    <div
      className="flex flex-col gap-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div className="flex flex-col gap-2">
        <StatRow label="Số Kudos bạn nhận được" value={stats.kudosReceived} />
        <Divider />
        <StatRow label="Số Kudos bạn đã gửi" value={stats.kudosSent} />
        <Divider />
        <StatRow label="Số tim bạn nhận được" value={stats.heartsReceived} />
        <Divider />
        {/* secretBoxCount shown as "đã mở"; "chưa mở" pending BE split */}
        <StatRow label="Số Secret Box bạn đã mở" value={stats.secretBoxCount} />
        <Divider />
        <StatRow label="Số Secret Box chưa mở" value={stats.secretBoxUnopened ?? 0} />
      </div>

      <button
        type="button"
        onClick={onOpenSecretBox}
        className="w-full rounded-lg font-bold transition-opacity hover:opacity-90"
        style={{
          background: 'rgba(255,234,158,1)',
          color: '#00101A',
          fontFamily: montserrat.style.fontFamily,
          fontSize: 14,
          fontWeight: 700,
          padding: '10px 20px',
        }}
      >
        Mở Secret Box
      </button>
    </div>
  )
}
