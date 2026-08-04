'use client'

/**
 * profile-hero.tsx — Avatar, name, department, tier badge, and hoa-thi stars.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb (Profile bản thân):
 *   Background: radial gradient, dark navy base rgba(0,16,26,1)
 *   Avatar: 96×96 circle, border 3px solid rgba(255,234,158,0.4)
 *   Name: Montserrat 700, 24px, #FFFFFF
 *   Dept/title: Montserrat 400, 14px, rgba(255,255,255,0.6)
 *   Tier badge: Montserrat 700, 12px, #FFEA9E background rgba(255,234,158,0.15)
 *   Stars (hoa-thi): shown only when tier ≠ null (received ≥ 10)
 *
 * Sparse-profile guard: null avatar → initials circle; null dept/title → no row.
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'
import type { ProfileHeaderProps } from './profile-types'

// ── Initials avatar fallback ─────────────────────────────────────────────────

function InitialsAvatar({ name, size }: { name: string; size: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      aria-label={`Avatar của ${name}`}
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: 'rgba(255,234,158,0.15)',
        border: '3px solid rgba(255,234,158,0.4)',
        color: '#FFEA9E',
        fontSize: size * 0.38,
        fontFamily: montserrat.style.fontFamily,
        fontWeight: 700,
      }}
    >
      {initial}
    </div>
  )
}

// ── Star icon (hoa-thi) ──────────────────────────────────────────────────────

function StarIcon({ filled }: { filled: boolean }) {
  return (
    /* mm:star-icon */
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden
      style={{ color: filled ? '#FFEA9E' : 'rgba(255,234,158,0.25)' }}
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="currentColor"
      />
    </svg>
  )
}

// ── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier, stars }: { tier: string; stars: number }) {
  return (
    /* mm:tier-badge */
    <div className="flex items-center gap-2">
      <span
        className="rounded-full px-3 py-1 text-xs font-bold"
        style={{
          background: 'rgba(255,234,158,0.15)',
          border: '1px solid rgba(255,234,158,0.3)',
          color: '#FFEA9E',
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 12,
          lineHeight: '18px',
        }}
      >
        {tier}
      </span>
      <div className="flex items-center gap-0.5" aria-label={`${stars} sao`}>
        {[1, 2, 3].map((n) => (
          <StarIcon key={n} filled={n <= stars} />
        ))}
      </div>
    </div>
  )
}

// ── ProfileHero ──────────────────────────────────────────────────────────────

export interface ProfileHeroProps {
  header: ProfileHeaderProps
}

export function ProfileHero({ header }: ProfileHeroProps) {
  const { full_name, avatar_url, department_id, title, tier, stars } = header
  const displayName = full_name ?? 'Sunner'
  const hasTier = tier !== null && stars !== null

  return (
    /* mm:profile-hero */
    <section
      aria-label="Thông tin cá nhân"
      className="flex flex-col items-center gap-4 px-6 py-10 text-center"
      style={{
        background: 'linear-gradient(180deg, rgba(255,234,158,0.08) 0%, rgba(0,16,26,0) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Avatar */}
      {/* mm:profile-avatar */}
      {avatar_url ? (
        <div
          style={{
            borderRadius: '50%',
            border: '3px solid rgba(255,234,158,0.4)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <Image
            src={avatar_url}
            alt={`Avatar của ${displayName}`}
            width={96}
            height={96}
            className="rounded-full object-cover"
            style={{ display: 'block' }}
          />
        </div>
      ) : (
        <InitialsAvatar name={displayName} size={96} />
      )}

      {/* Name */}
      {/* mm:profile-name */}
      <h1
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 24,
          color: '#FFFFFF',
          lineHeight: '32px',
          margin: 0,
        }}
      >
        {displayName}
      </h1>

      {/* Department + Title — omitted entirely when both null */}
      {(department_id ?? title) && (
        /* mm:profile-dept-title */
        <div className="flex flex-col items-center gap-1">
          {department_id && (
            <p
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 400,
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: '20px',
                margin: 0,
              }}
            >
              {department_id}
            </p>
          )}
          {title && (
            <p
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 400,
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: '20px',
                margin: 0,
              }}
            >
              {title}
            </p>
          )}
        </div>
      )}

      {/* Tier + stars — only when received ≥ 10 (tier non-null from Track B) */}
      {hasTier && <TierBadge tier={tier} stars={stars} />}
    </section>
  )
}
