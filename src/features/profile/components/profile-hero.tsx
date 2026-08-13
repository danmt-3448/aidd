'use client'

/**
 * profile-hero.tsx — Profile info section overlaid on keyvisual.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb (get_node verified):
 *   Section (mms_A_Info, 362:5052): height 468px, gap 32px, centered, starts at y=184 in keyvisual
 *   Avatar (362:5053): 200×200px circle, border 4px solid rgba(255,255,255,1)
 *   Name (362:5055): Montserrat 700, 36px, color rgba(255,234,158,1) (gold), lineHeight 44px
 *   Dept (362:5057): Montserrat 700, 22px, color rgba(255,255,255,1)
 *   Tier badge: pill with gold text on dark bg
 *
 * Rendered inside the keyvisual overlay (pt-[184px] from keyvisual top).
 * Sparse-profile guard: null avatar → initials circle; null dept/title → no row.
 */

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import type { ProfileHeaderProps } from './profile-types'

// ── Initials avatar fallback ─────────────────────────────────────────────────

function InitialsAvatar({ name, size, ariaLabel }: { name: string; size: number; ariaLabel: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      aria-label={ariaLabel}
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: 'rgba(0,7,12,0.6)',
        border: '4px solid rgba(255,255,255,1)',
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

// ── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  return (
    <div
      className="rounded-full px-4 py-1"
      style={{
        background: 'rgba(255,234,158,0.15)',
        border: '1px solid rgba(255,234,158,0.4)',
        color: '#FFEA9E',
        fontFamily: montserrat.style.fontFamily,
        fontWeight: 700,
        fontSize: 14,
        lineHeight: '20px',
      }}
    >
      {tier}
    </div>
  )
}

// ── ProfileHero ──────────────────────────────────────────────────────────────

export interface ProfileHeroProps {
  header: ProfileHeaderProps
}

export function ProfileHero({ header }: ProfileHeroProps) {
  const t = useTranslations('profile')
  const { full_name, avatar_url, department_id, title, tier } = header
  const displayName = full_name ?? 'Sunner'
  const avatarLabel = t('hero.avatarLabel', { name: displayName })

  return (
    /* mm:profile-hero — mms_A_Info 362:5052 — centered over keyvisual */
    <section
      data-fig="362:5052"
      aria-label={t('hero.sectionLabel')}
      className="flex flex-col items-center text-center"
      style={{
        gap: 32,
        paddingTop: 184,
        paddingBottom: 40,
      }}
    >
      {/* Avatar — 200×200px (362:5053), border 4px solid white */}
      {/* mm:profile-avatar */}
      {avatar_url ? (
        <div
          style={{
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,1)',
            flexShrink: 0,
            overflow: 'hidden',
            width: 200,
            height: 200,
          }}
        >
          <Image
            src={avatar_url}
            alt={avatarLabel}
            width={200}
            height={200}
            className="rounded-full object-cover"
            style={{ display: 'block' }}
          />
        </div>
      ) : (
        <InitialsAvatar name={displayName} size={200} ariaLabel={avatarLabel} />
      )}

      {/* Info block: name + dept/title + tier */}
      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        {/* Name — 362:5055: Montserrat 700 36px rgba(255,234,158,1) */}
        {/* mm:profile-name */}
        <h1
          data-fig="362:5055"
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 36,
            color: 'rgba(255,234,158,1)',
            lineHeight: '44px',
            margin: 0,
          }}
        >
          {displayName}
        </h1>

        {/* Department + Title — 362:5057: Montserrat 700 22px rgba(255,255,255,1) */}
        {(department_id ?? title) && (
          /* mm:profile-dept-title */
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            {department_id && (
              <p
                data-fig="362:5057"
                style={{
                  fontFamily: montserrat.style.fontFamily,
                  fontWeight: 700,
                  fontSize: 22,
                  color: 'rgba(255,255,255,1)',
                  lineHeight: '28px',
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
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '24px',
                  margin: 0,
                }}
              >
                {title}
              </p>
            )}
          </div>
        )}

        {/* Tier badge — shown when received ≥ 10 */}
        {tier && <TierBadge tier={tier} />}
      </div>
    </section>
  )
}
