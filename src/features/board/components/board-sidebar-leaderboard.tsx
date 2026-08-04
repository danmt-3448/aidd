'use client'

/**
 * board-sidebar-leaderboard.tsx — ranked list component for the board sidebar.
 * Extracted from board-sidebar.tsx to keep files under 200 lines.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Top-3 rank: Montserrat 700 14px #FFEA9E
 *   Other rank: Montserrat 700 14px rgba(255,255,255,0.5)
 *   Avatar: 32×32 rounded-full
 *   Empty: "Chưa có dữ liệu." rgba(255,255,255,0.3)
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'
import type { LeaderboardEntry } from './board-types'

function AvatarSmall({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        className="rounded-full object-cover"
        style={{ flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: 32,
        height: 32,
        background: 'rgba(255,234,158,0.12)',
        border: '1px solid rgba(255,234,158,0.2)',
        color: '#FFEA9E',
        fontSize: 12,
        fontFamily: montserrat.style.fontFamily,
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export interface SidebarLeaderboardProps {
  title: string
  entries: LeaderboardEntry[]
  scoreLabel: string
}

export function SidebarLeaderboard({ title, entries, scoreLabel }: SidebarLeaderboardProps) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="tracking-[1.5px]"
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </p>

      {entries.length === 0 ? (
        <p
          className="py-4 text-center text-sm"
          style={{
            fontFamily: montserrat.style.fontFamily,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          Chưa có dữ liệu.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isTopThree = entry.rank <= 3
            return (
              <li key={entry.id} className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: montserrat.style.fontFamily,
                    fontWeight: 700,
                    fontSize: 14,
                    color: isTopThree ? '#FFEA9E' : 'rgba(255,255,255,0.5)',
                    minWidth: 20,
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                  aria-label={`Hạng ${entry.rank}`}
                >
                  {entry.rank}
                </span>

                <AvatarSmall src={entry.avatarUrl} name={entry.name} />

                <span
                  className="flex-1 truncate text-sm font-bold"
                  style={{
                    fontFamily: montserrat.style.fontFamily,
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {entry.name}
                </span>

                <span
                  className="flex-shrink-0 text-sm font-bold"
                  style={{
                    fontFamily: montserrat.style.fontFamily,
                    color: isTopThree ? '#FFEA9E' : 'rgba(255,255,255,0.5)',
                  }}
                  aria-label={`${entry.score} ${scoreLabel}`}
                >
                  {entry.score}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
