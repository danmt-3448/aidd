'use client'

/**
 * board-sidebar-leaderboard.tsx — "10 SUNNER NHẬN QUÀ MỚI NHẤT" list for the board sidebar.
 *
 * Design tokens from Figma node 2940:13510 (D.3_10 SUNNER nhận quà):
 *   Container: bg #00070C, border 1px solid #998C5F, border-radius 17px, padding 24px 16px 24px 24px
 *   Title (D.3.1): Montserrat 700 16px rgba(255,234,158,1) centered, 2 lines
 *   Entry row (D.3.2): height 48px, flex-row, gap 8px, align-center
 *   Rank number: Montserrat 700 14px rgba(255,234,158,1) w-6 text-right — Figma has 1→10
 *   Avatar: 40×40 circle, border 1.5px solid #FFF
 *   Name: Montserrat 600 14px rgba(255,234,158,1) left-aligned, truncate
 *   Sub-line: Montserrat 400 12px rgba(255,255,255,0.7)
 *   Entry rows gap: 12px
 */

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { UserHoverCard } from './board-user-hover-card'
import type { LeaderboardEntry } from './board-types'

function AvatarCompact({
  src,
  name,
  onSendKudo,
}: {
  src: string | null
  name: string
  onSendKudo?: () => void
}) {
  const avatar = src ? (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      className="rounded-full object-cover"
      style={{
        flexShrink: 0,
        border: '1.5px solid #FFFFFF',
      }}
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: 40,
        height: 40,
        background: 'rgba(255,234,158,0.12)',
        border: '1.5px solid #FFFFFF',
        color: '#FFEA9E',
        fontSize: 14,
        fontFamily: montserrat.style.fontFamily,
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )

  return (
    <UserHoverCard
      name={name}
      avatarUrl={src}
      onSendKudo={onSendKudo}
      lightMode={false}
    >
      {avatar}
    </UserHoverCard>
  )
}

export interface SidebarLeaderboardProps {
  entries: LeaderboardEntry[]
  /**
   * Called when "Gửi KUDO" is clicked inside a user's hover card.
   */
  onSendKudo?: (userId: string) => void
}

export function SidebarLeaderboard({
  entries,
  onSendKudo,
}: SidebarLeaderboardProps) {
  const t = useTranslations('leaderboard')

  return (
    <div
      className="flex flex-col"
      style={{
        background: '#00070C',
        border: '1px solid #998C5F',
        borderRadius: 17,
        padding: '24px 16px 24px 24px',
        gap: 10,
      }}
    >
      {/* Title — 2-line gold centered header */}
      <p
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 16,
          color: 'rgba(255,234,158,1)',
          lineHeight: '22px',
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'pre-line',
        }}
      >
        {t('title')}
      </p>

      {entries.length === 0 ? (
        <p
          className="py-4 text-center"
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {t('empty')}
        </p>
      ) : (
        <ol className="flex flex-col" style={{ gap: 12 }}>
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className="flex items-center"
              style={{ gap: 8, minHeight: 48 }}
            >
              {/* Rank number — 1-indexed, gold, right-aligned in fixed width */}
              <span
                aria-label={t('rankLabel', { rank: index + 1 })}
                style={{
                  fontFamily: montserrat.style.fontFamily,
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'rgba(255,234,158,1)',
                  lineHeight: '20px',
                  width: 20,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>

              {/* Avatar 40×40 with white border */}
              <AvatarCompact
                src={entry.avatarUrl}
                name={entry.name}
                onSendKudo={onSendKudo ? () => onSendKudo(entry.id) : undefined}
              />

              {/* Name + prize description */}
              <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 2 }}>
                <span
                  className="truncate"
                  style={{
                    fontFamily: montserrat.style.fontFamily,
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'rgba(255,234,158,1)',
                    lineHeight: '20px',
                  }}
                >
                  {entry.name}
                </span>
                {entry.prize && (
                  <span
                    className="truncate"
                    style={{
                      fontFamily: montserrat.style.fontFamily,
                      fontWeight: 400,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: '16px',
                    }}
                  >
                    {entry.prize}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
