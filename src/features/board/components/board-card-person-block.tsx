'use client'

/**
 * board-card-person-block.tsx — avatar + name + department + optional tier badge.
 * Extracted from board-feed-card.tsx to keep that file under 200 lines.
 *
 * Used in both sender and receiver positions of a kudo card.
 * When interactive=true (senderId not null / receiver always), renders as a <button>.
 * When interactive=false (anonymous sender), renders as a plain <div>.
 *
 * lightMode=true: card bg is cream — department text uses dark muted color.
 */

import { montserrat } from '@/features/auth/fonts'
import { AvatarCircle } from './board-card-atoms'
import { FeedCardTierBadge } from './feed-card-tier-badge'

export interface PersonBlockProps {
  avatarUrl: string | null
  name: string
  /** CSS color string for the name span */
  nameColor: string
  department?: string
  tier?: 1 | 2 | 3 | 4
  interactive: boolean
  label: string
  onClick?: () => void
  /** When true the card background is light — adjusts department text color */
  lightMode?: boolean
}

export function PersonBlock({
  avatarUrl,
  name,
  nameColor,
  department,
  tier,
  interactive,
  label,
  onClick,
  lightMode = false,
}: PersonBlockProps) {
  const deptColor = lightMode ? 'rgba(26,18,8,0.45)' : 'rgba(255,255,255,0.5)'

  const inner = (
    <>
      <AvatarCircle src={avatarUrl} name={name} size={40} lightMode={lightMode} />
      <div className="flex min-w-0 flex-col">
        <span
          className="truncate font-bold leading-5"
          style={{ fontFamily: montserrat.style.fontFamily, fontSize: 14, color: nameColor }}
        >
          {name}
        </span>
        {department && (
          <span
            className="truncate"
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontSize: 12,
              color: deptColor,
              lineHeight: '16px',
            }}
          >
            {department}
          </span>
        )}
      </div>
      {tier && <FeedCardTierBadge tier={tier} />}
    </>
  )

  if (interactive && onClick) {
    return (
      <button
        type="button"
        className="flex min-w-0 flex-shrink items-center gap-2 transition-opacity hover:opacity-80"
        aria-label={label}
        onClick={onClick}
      >
        {inner}
      </button>
    )
  }

  return (
    <div className="flex min-w-0 flex-shrink items-center gap-2" aria-label={label}>
      {inner}
    </div>
  )
}
