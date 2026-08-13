'use client'

/**
 * board-hover-card-popup.tsx — inner portal popup for board-user-hover-card.tsx.
 *
 * Isolated in its own file so it can hold the useUserHoverCard hook without
 * inflating board-user-hover-card.tsx past 200 lines. This component is ONLY
 * mounted when the hover card is open, keeping the data fetch lazy.
 *
 * Privacy: kudosSent is 0 for third-party views (RLS on profile_stats.sent).
 * We render it as-is from the server action. Received count is always shown. (SEC_001)
 */

import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { AvatarCircle } from './board-card-atoms'
import { FeedCardTierBadge } from './feed-card-tier-badge'
import { useUserHoverCard } from '../use-user-hover-card'

const GOLD = '#FFEA9E'
const BROWN = '#92400E'

/** Formats a number as locale string, returns "–" when undefined. */
function fmtCount(n: number | undefined): string {
  if (n === undefined) return '–'
  return n.toLocaleString('vi-VN')
}

export interface PopupPosition {
  top: number
  left: number
}

export interface HoverCardPopupProps {
  name: string
  role?: string
  /** Department short code from parent props — overridden by live data */
  departmentFallback?: string
  avatarUrl: string | null
  /** Tier from parent props — overridden by live data */
  tierFallback?: 1 | 2 | 3 | 4
  profileId: string | null
  onSendKudo?: () => void
  position: PopupPosition
  popoverId: string
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function HoverCardPopup({
  name,
  role,
  departmentFallback,
  avatarUrl,
  tierFallback,
  profileId,
  onSendKudo,
  position,
  popoverId,
  onMouseEnter,
  onMouseLeave,
}: HoverCardPopupProps) {
  // Hook mounted only when this component renders (popup is open)
  const { data: liveData, isLoading } = useUserHoverCard(profileId)
  const t = useTranslations('userCard')

  const department = liveData?.department ?? departmentFallback
  const tier = (liveData?.tier ?? tierFallback) as 1 | 2 | 3 | 4 | undefined
  const kudosReceived = liveData?.kudosReceived
  const kudosSent = liveData?.kudosSent

  const subtleColor = 'rgba(255,255,255,0.55)'
  const cardBg = '#00101A'
  const cardBorder = '1px solid rgba(255,234,158,0.18)'
  const dividerColor = 'rgba(255,255,255,0.08)'

  return createPortal(
    <span
      id={popoverId}
      role="tooltip"
      aria-label={t('ariaLabel', { name })}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        minWidth: 240,
        pointerEvents: 'auto',
      }}
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
          <AvatarCircle src={avatarUrl} name={name} size={40} lightMode={false} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span
              className="truncate text-sm font-bold leading-5"
              style={{ color: GOLD }}
            >
              {name}
            </span>
            {role && (
              <span
                className="truncate text-xs"
                style={{ color: subtleColor, lineHeight: '16px' }}
              >
                {role}
              </span>
            )}
          </span>
          {tier && (
            <span className="ml-auto flex-shrink-0">
              <FeedCardTierBadge tier={tier} />
            </span>
          )}
        </span>

        {/* Department — "Tên đơn vị: {dept}" per spec §3 */}
        {(department || isLoading) && (
          <span className="text-xs leading-4" style={{ color: subtleColor }}>
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>{t('departmentLabel')} </span>
            {isLoading && !department ? (
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>…</span>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{department}</span>
            )}
          </span>
        )}

        {/* Divider */}
        <span aria-hidden style={{ display: 'block', height: 1, background: dividerColor }} />

        {/* Kudos stats — per spec §3 */}
        <span className="flex flex-col gap-1.5">
          <span
            className="flex items-center justify-between text-xs"
            style={{ color: subtleColor }}
          >
            <span>{t('kudosReceived')}</span>
            <span className="font-bold" style={{ color: GOLD }}>
              {isLoading && kudosReceived === undefined ? '…' : fmtCount(kudosReceived)}
            </span>
          </span>
          {/* kudosSent shown as-is (0 for third-party views — RLS, SEC_001) */}
          <span
            className="flex items-center justify-between text-xs"
            style={{ color: subtleColor }}
          >
            <span>{t('kudosSent')}</span>
            <span className="font-bold" style={{ color: GOLD }}>
              {isLoading && kudosSent === undefined ? '…' : fmtCount(kudosSent)}
            </span>
          </span>
        </span>

        {/* Gửi KUDO button — per spec §3 */}
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
            {t('sendKudo')}
          </button>
        )}
      </span>
    </span>,
    document.body,
  )
}
