import Image from 'next/image'
import { AwardsNav } from './awards-nav'
import { AwardCard } from './award-card'
import { KudosPromo } from './kudos-promo'
import type { AwardsShowcaseProps } from '../types'

/**
 * Root awards showcase component.
 * Composes: "Further" hero logo + title section + left-nav + award cards + kudos promo + footer text.
 * Background: rgba(0,16,26,1) — from Figma root frame #313:8436.
 *
 * Integration contract: accepts Award[] prop; left-nav scroll wiring deferred to integration phase.
 * App-level header/footer shell: wired by integration phase via layout — not included here.
 */
export function AwardsShowcase({ awards }: AwardsShowcaseProps) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: 'rgba(0,16,26,1)' }}
    >
      {/* Content block — padded 96px vertical, 144px horizontal (Figma Bìa frame) */}
      <div
        className="mx-auto w-full"
        style={{ maxWidth: '1440px', padding: '96px 144px' }}
      >
        {/* KV: "Further" event logo */}
        <div className="mb-30 relative" style={{ width: '338px', height: '150px', marginBottom: '120px' }}>
          <Image
            src="/awards/further-logo.png"
            alt="Further — Sun* Annual Awards 2025"
            fill
            priority
            className="object-contain object-left"
          />
        </div>

        {/* Title section: "Sun* Annual Awards 2025" + divider + headline */}
        <div className="mb-28 flex flex-col gap-4">
          <p
            className="w-full text-center font-montserrat text-2xl font-bold leading-8"
            style={{ color: '#FFFFFF' }}
          >
            Sun* Annual Awards 2025
          </p>
          {/* Thin horizontal rule */}
          <div style={{ height: '1px', backgroundColor: 'rgba(46,57,64,1)', width: '100%' }} />
          {/* Main page heading */}
          <div className="flex items-center justify-center gap-8">
            <h1
              className="font-montserrat font-bold"
              style={{
                fontSize: 'clamp(36px, 4vw, 57px)',
                lineHeight: '64px',
                letterSpacing: '-0.25px',
                color: '#FFEA9E',
              }}
            >
              Hệ thống giải thưởng SAA 2025
            </h1>
          </div>
        </div>

        {/* Main layout: left sticky nav + right award cards (80px gap per Figma) */}
        <div className="flex flex-col gap-20 lg:flex-row lg:items-start" style={{ gap: '80px' }}>
          {/* Left navigation — hidden below lg, sticky on desktop */}
          <div className="hidden lg:block">
            <AwardsNav awards={awards} />
          </div>

          {/* Award cards list — 80px gap between cards per Figma */}
          <div className="flex flex-1 flex-col" style={{ gap: '80px' }}>
            {awards.map((award) => (
              <AwardCard key={award.slug} award={award} />
            ))}
          </div>
        </div>

        {/* SunKudos promo section */}
        <div style={{ marginTop: '120px' }}>
          <KudosPromo />
        </div>
      </div>

      {/* Footer — matches Figma Footer INSTANCE */}
      <footer
        className="flex flex-col items-center justify-between gap-4 border-t px-36 py-8 md:flex-row"
        style={{
          borderColor: 'rgba(46,57,64,1)',
          backgroundColor: 'rgba(0,16,26,1)',
        }}
      >
        <div className="relative h-10 w-36">
          <Image
            src="/awards/logo-footer.png"
            alt="Sun* logo"
            fill
            className="object-contain object-left"
          />
        </div>
        <p
          className="font-montserrat-alternates text-center text-base font-bold leading-6"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          Bản quyền thuộc về Sun* © 2025
        </p>
      </footer>
    </div>
  )
}
