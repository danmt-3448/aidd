'use client'

/**
 * board-card-person-block.tsx — avatar + name + department + optional tier badge.
 *
 * VERTICAL layout (rework pass 3 — per user Figma feedback):
 *   Avatar (circular) on top → bold name below → "dept · [tier badge]" row below.
 *   Two blocks sit side-by-side in the card header with the send icon between them.
 *
 * Source: user Figma screenshot feedback — "Person block DỌC: avatar viền tròn ở TRÊN,
 * tên ĐẬM ở dưới, dòng 'CEVC10 · [tier badge]' dưới nữa."
 *
 * When interactive=true (senderId not null / receiver always), renders as a <button>.
 * When interactive=false (anonymous sender), renders as a plain <div>.
 *
 * Hover/focus on the person block shows a UserHoverCard popover with:
 *   avatar, name, role/dept, tier pill, kudos stats (25/25 from Figma), "Gửi KUDO" button.
 * Click on avatar/name still navigates to profile (onClick preserved).
 */

import { montserrat } from '@/features/auth/fonts'
import { AvatarCircle } from './board-card-atoms'
import { FeedCardTierBadge } from './feed-card-tier-badge'
import { UserHoverCard } from './board-user-hover-card'

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
  /**
   * Called when "Gửi KUDO" is clicked inside the hover popover.
   * If undefined, the button is not rendered.
   */
  onSendKudo?: () => void
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
  onSendKudo,
}: PersonBlockProps) {
  const deptColor = lightMode ? 'rgba(26,18,8,0.45)' : 'rgba(255,255,255,0.5)'

  /**
   * Vertical layout: avatar on top, name below, then dept·tier on same row.
   * ⚠️ Avatar size 40px — existing Figma-sourced value (previously MoMorph MCP D1).
   * Vertical alignment confirmed from user feedback (Figma screenshot).
   */
  const inner = (
    <span className="flex flex-col items-center gap-1.5 text-center">
      <AvatarCircle src={avatarUrl} name={name} size={40} lightMode={lightMode} />
      <span
        className="max-w-[100px] truncate font-bold leading-5"
        style={{ fontFamily: montserrat.style.fontFamily, fontSize: 13, color: nameColor }}
      >
        {name}
      </span>
      {(department || tier) && (
        <span
          className="flex items-center gap-1"
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontSize: 11,
            color: deptColor,
            lineHeight: '16px',
          }}
        >
          {department && <span className="max-w-[60px] truncate">{department}</span>}
          {tier && (
            <>
              {department && <span aria-hidden>·</span>}
              <FeedCardTierBadge tier={tier} lightMode={lightMode} />
            </>
          )}
        </span>
      )}
    </span>
  )

  const trigger =
    interactive && onClick ? (
      <button
        type="button"
        className="flex flex-shrink-0 flex-col items-center transition-opacity hover:opacity-80"
        aria-label={label}
        onClick={onClick}
      >
        {inner}
      </button>
    ) : (
      <span className="flex flex-shrink-0 flex-col items-center" aria-label={label}>
        {inner}
      </span>
    )

  return (
    <UserHoverCard
      name={name}
      department={department}
      avatarUrl={avatarUrl}
      tier={tier}
      onSendKudo={onSendKudo}
      lightMode={lightMode}
    >
      {trigger}
    </UserHoverCard>
  )
}
