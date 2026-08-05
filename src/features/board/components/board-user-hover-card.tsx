'use client'

/**
 * board-user-hover-card.tsx — popover shown on hover/focus of any user avatar.
 *
 * Figma annotation "Hover Avatar info user" (outside artboard MaZUn5xHXZ):
 *   Content: avatar (40px) + tên + role/phòng ban + tier pill + kudos stats + "Gửi KUDO" button.
 *   Numbers: "Số Kudos nhận được: 25" / "Số Kudos đã gửi: 25" — lấy từ Figma annotation.
 *
 * Implementation: pure CSS + React state — no external popover library
 * (Radix not in package.json; YAGNI rule: do not add heavy dep for a tooltip).
 * Keyboard: trigger is focusable; popover shows on focus-within, hides on blur.
 */

import { useRef, useState, useCallback, useId } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { AvatarCircle } from './board-card-atoms'
import { FeedCardTierBadge } from './feed-card-tier-badge'

export interface UserHoverCardProps {
  /** The interactive trigger element (avatar + name button) */
  children: React.ReactNode
  /** User displayed in the popover */
  name: string
  role?: string
  department?: string
  avatarUrl: string | null
  tier?: 1 | 2 | 3 | 4
  /** Kudos counts shown in the card — defaults to 25/25 per Figma annotation */
  kudosReceived?: number
  kudosSent?: number
  /** Called when "Gửi KUDO" button is clicked */
  onSendKudo?: () => void
  /** Whether the host card background is light (cream) — affects popover palette */
  lightMode?: boolean
}

const GOLD = '#FFEA9E'
const BROWN = '#92400E'

export function UserHoverCard({
  children,
  name,
  role,
  department,
  avatarUrl,
  tier,
  kudosReceived = 25,
  kudosSent = 25,
  onSendKudo,
  lightMode = false,
}: UserHoverCardProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popoverId = useId()

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  // Small delay prevents flicker when moving between trigger and popover
  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  const textColor = lightMode ? BROWN : GOLD
  const subtleColor = lightMode ? 'rgba(26,18,8,0.55)' : 'rgba(255,255,255,0.55)'
  const cardBg = lightMode ? '#FFFBF0' : '#1E1A2E'
  const cardBorder = lightMode ? '1px solid rgba(146,64,14,0.18)' : '1px solid rgba(255,234,158,0.18)'
  const dividerColor = lightMode ? 'rgba(26,18,8,0.08)' : 'rgba(255,255,255,0.08)'

  return (
    <span
      className="relative inline-flex min-w-0 shrink"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}

      {open && (
        <span
          id={popoverId}
          role="tooltip"
          aria-label={`Thông tin ${name}`}
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute left-0 top-full z-50 mt-2"
          style={{ minWidth: 220 }}
        >
          <span
            className="flex flex-col gap-3 rounded-2xl p-4 shadow-xl"
            style={{
              background: cardBg,
              border: cardBorder,
              fontFamily: montserrat.style.fontFamily,
            }}
          >
            {/* Avatar + name row */}
            <span className="flex items-center gap-3">
              <AvatarCircle src={avatarUrl} name={name} size={40} lightMode={lightMode} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className="truncate text-sm font-bold leading-5"
                  style={{ color: textColor }}
                >
                  {name}
                </span>
                {(role || department) && (
                  <span
                    className="truncate text-xs"
                    style={{ color: subtleColor, lineHeight: '16px' }}
                  >
                    {[role, department].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
              {tier && (
                <span className="ml-auto flex-shrink-0">
                  <FeedCardTierBadge tier={tier} />
                </span>
              )}
            </span>

            {/* Divider */}
            <span
              aria-hidden
              style={{ display: 'block', height: 1, background: dividerColor }}
            />

            {/* Kudos stats */}
            <span className="flex flex-col gap-1.5">
              <span
                className="flex items-center justify-between text-xs"
                style={{ color: subtleColor }}
              >
                <span>Số Kudos nhận được</span>
                <span className="font-bold" style={{ color: textColor }}>
                  {kudosReceived}
                </span>
              </span>
              <span
                className="flex items-center justify-between text-xs"
                style={{ color: subtleColor }}
              >
                <span>Số Kudos đã gửi</span>
                <span className="font-bold" style={{ color: textColor }}>
                  {kudosSent}
                </span>
              </span>
            </span>

            {/* Gửi KUDO button */}
            {onSendKudo && (
              <button
                type="button"
                onClick={onSendKudo}
                className="mt-1 w-full rounded-full py-2 text-xs font-bold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                style={{
                  background: 'linear-gradient(135deg, #FFEA9E 0%, #F59E0B 100%)',
                  color: BROWN,
                  fontFamily: montserrat.style.fontFamily,
                  letterSpacing: '0.04em',
                }}
              >
                Gửi KUDO
              </button>
            )}
          </span>
        </span>
      )}
    </span>
  )
}
