'use client'

/**
 * BoardSpotlight — recipient word-cloud with kudo count, artwork, activity log, expand toggle.
 *
 * Design (Figma screen MaZUn5xHXZ):
 *   Container: dark box, bo góc có viền, nền tối texture
 *   Layout: "388 KUDOS" centered top · word-cloud dày · artwork gradient mép trái
 *   Bottom-left: activity log (4–5 dòng "HH:MM {tên} đã nhận được một Kudos mới")
 *   Bottom-right: icon mở rộng (expand arrows icon button)
 *   Artwork: gradient màu tràn mép trái (purple/blue/teal) - no exportable Figma asset
 */

import { useMemo, useState } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { BoardSpotlightWordCloud, computeWordLayout } from './board-spotlight-word-cloud'
import { SectionEyebrow } from './board-section-eyebrow'
import type { SpotlightNode, SpotlightActivityEntry } from './board-types'

export interface BoardSpotlightProps {
  nodes: SpotlightNode[]
  totalKudos: number
  activityLog?: SpotlightActivityEntry[]
  onOpenProfile: (receiverId: string) => void
}

/** Expand / Compress arrows icon */
function ExpandIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden>
        <path d="M4 14h6m0 0v6m0-6l-7 7M20 10h-6m0 0V4m0 6l7-7" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden>
      <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
    </svg>
  )
}

function ActivityLog({ entries }: { entries: SpotlightActivityEntry[] }) {
  if (entries.length === 0) return null
  return (
    <div className="flex flex-col gap-1" aria-label="Hoạt động gần đây">
      {entries.map((entry, i) => (
        <p
          key={i}
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ color: 'rgba(255,234,158,0.7)', fontWeight: 600 }}>{entry.time}</span>
          {' '}
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{entry.name}</span>
          {' '}đã nhận được một Kudos mới
        </p>
      ))}
    </div>
  )
}

export function BoardSpotlight({ nodes, totalKudos, activityLog = [], onOpenProfile }: BoardSpotlightProps) {
  const [expanded, setExpanded] = useState(false)

  const layout = useMemo(() => computeWordLayout(nodes), [nodes])
  const cloudHeight = expanded ? 400 : 220

  return (
    <section aria-label="Spotlight Board — nhận được nhiều Kudos nhất">
      {/* Eyebrow + section title */}
      <SectionEyebrow />
      <h2
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 'clamp(32px, 4vw, 57px)',
          color: '#FFEA9E',
          lineHeight: 1.1,
          letterSpacing: '-0.25px',
          marginBottom: 16,
        }}
      >
        SPOTLIGHT BOARD
      </h2>

      {/* Dark box with border */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'rgba(0,8,18,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '24px 24px 0 24px',
        }}
      >
        {/* Artwork: color gradient bleeding from left edge — decorative */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{
            width: 180,
            background: `linear-gradient(
              135deg,
              rgba(139,92,246,0.35) 0%,
              rgba(59,130,246,0.25) 40%,
              rgba(20,184,166,0.15) 70%,
              transparent 100%
            )`,
          }}
        />

        {/* Total kudo count — centered */}
        <p
          className="relative z-10 mb-2 text-center"
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 28,
            color: '#FFEA9E',
            lineHeight: '34px',
            letterSpacing: '1px',
          }}
          aria-label={`${totalKudos} kudos tổng`}
        >
          {totalKudos.toLocaleString('vi-VN')} KUDOS
        </p>

        {/* Word-cloud canvas */}
        <div className="relative z-10">
          <BoardSpotlightWordCloud
            layout={layout}
            height={cloudHeight}
            search=""
            onOpenProfile={onOpenProfile}
          />
        </div>

        {/* Bottom bar: activity log left + expand icon right */}
        <div
          className="relative z-10 flex items-end justify-between gap-4 pb-4 pt-3"
          style={{ minHeight: 72 }}
        >
          <div className="min-w-0 flex-1">
            <ActivityLog entries={activityLog} />
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-pressed={expanded}
            aria-label={expanded ? 'Thu gọn spotlight' : 'Mở rộng spotlight'}
            className="flex flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
            style={{
              width: 36,
              height: 36,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <ExpandIcon expanded={expanded} />
          </button>
        </div>
      </div>
    </section>
  )
}
