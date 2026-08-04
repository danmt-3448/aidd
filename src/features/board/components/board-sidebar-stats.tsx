'use client'

/**
 * board-sidebar-stats.tsx — stats grid + "Mở quà" button for the board sidebar.
 * Extracted from board-sidebar.tsx to keep files under 200 lines.
 */

import { montserrat } from '@/features/auth/fonts'
import type { BoardUserStats } from './board-types'

interface StatItemProps {
  label: string
  value: number
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <p
        className="tracking-[1.5px]"
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p
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
      </p>
    </div>
  )
}

export interface StatsCardProps {
  stats: BoardUserStats
  onOpenSecretBox: () => void
}

export function StatsCard({ stats, onOpenSecretBox }: StatsCardProps) {
  return (
    <div
      className="flex flex-col gap-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <StatItem label="Kudos nhận" value={stats.kudosReceived} />
        <StatItem label="Kudos gửi" value={stats.kudosSent} />
        <StatItem label="Hearts" value={stats.heartsReceived} />
        <StatItem label="Secret Box" value={stats.secretBoxCount} />
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
        Mở quà
      </button>
    </div>
  )
}
