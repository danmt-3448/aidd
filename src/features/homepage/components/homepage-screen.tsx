'use client'

/**
 * HomepageScreen — root composer for the SAA 2025 Homepage.
 *
 * Sections (top-to-bottom per Figma node 2167:9026 "Homepage SAA"):
 *   1. HomepageHeader (sticky, z-50)
 *   2. HomepageHero (full keyvisual, countdown, CTAs, fixed FAB)
 *   3. Padding spacer
 *   4. HomepageAwardsGrid (6-card, 3→2→1 responsive)
 *   5. KudosPromo (reused from /awards, same component)
 *   6. HomepageFooter
 *
 * Background: rgba(0,16,26,1) — same dark navy as /awards page.
 *
 * Integration contract (all props flow down from here):
 *   - header: HomepageHeaderProps
 *   - hero countdown: HomepageCountdownProps (→ useCountdown() in integration phase)
 *   - onQuickAction: () => void (→ opens KudoComposeModal in integration phase)
 *   - awards: Award[] (→ AWARDS constant, already wired via default prop)
 *
 * The KudoComposeModal import is present but the modal is only mounted when
 * onQuickAction triggers it — zero cost when closed.
 */

import { useState } from 'react'
import { AWARDS } from '@/features/awards/award-config'
import { KudosPromo } from '@/features/awards/components/kudos-promo'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
import type { HomepageHeaderProps } from './homepage-header'
import type { HomepageCountdownProps } from './homepage-hero'
import { HomepageHeader } from './homepage-header'
import { HomepageHero } from './homepage-hero'
import { HomepageAwardsGrid } from './homepage-awards-grid'
import { HomepageFooter } from './homepage-footer'

export interface HomepageScreenProps {
  /** Passed straight to HomepageHeader — integration wires session + unreadCount. */
  header: HomepageHeaderProps
  /** Passed to HomepageHero countdown blocks — integration wires useCountdown(). */
  countdown: HomepageCountdownProps
}

export function HomepageScreen({ header, countdown }: HomepageScreenProps) {
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'rgba(0,16,26,1)' }}
    >
      {/* Sticky header */}
      <HomepageHeader
        unreadCount={header.unreadCount}
        user={header.user}
        uid={header.uid}
        isAdmin={header.isAdmin}
      />

      {/* Main content — full-width sections */}
      <main>
        {/* Hero: keyvisual + countdown + CTAs + fixed FAB.
            FAB is auth-gated (H-3): only pass onQuickAction when a user session exists.
            Anonymous visitors get no FAB. */}
        <HomepageHero
          countdown={countdown}
          onWriteKudo={header.user !== null ? () => setComposeOpen(true) : undefined}
        />

        {/* Inner content block — padded, max-width container */}
        <div
          className="mx-auto flex w-full max-w-[1512px] flex-col gap-16 px-4 py-16 md:px-16 md:py-24 xl:gap-[120px] xl:px-36 xl:py-24"
        >
          {/* 6-award card grid */}
          <HomepageAwardsGrid awards={AWARDS} />

          {/* Sun* Kudos promo — reused from /awards page */}
          <KudosPromo />
        </div>
      </main>

      {/* Footer */}
      <HomepageFooter />

      {/* Quick-action Kudo compose modal — mounted only when open */}
      {composeOpen && (
        <KudoComposeModal onClose={() => setComposeOpen(false)} />
      )}
    </div>
  )
}
